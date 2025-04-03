import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import fileRoutes from './routes/file.api.js';
import ipfsRoutes from './routes/ipfs.store.api.js';
import authRoute from './routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shareTokenRoutes from "./routes/share.token.api.js";
import { startCleanupJob } from './util/cleanupJob.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Disable X-Powered-By header to hide Express version information
app.disable('x-powered-by');

// Create different rate limiters for different endpoints
// More lenient rate limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Allow more login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later'
});

// Rate limiting for general API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Higher limit for general API usage
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting selectively to routes
// Don't apply the general limiter to everything

// Middlewares
// Add Helmet for security headers including CSP
app.use(helmet());

// Configure specific CSP rules
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on your needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "localhost:5001", "http://localhost:5001"], // Allow IPFS connections
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(cookieParser());

startCleanupJob();

// Authentication middleware to protect sensitive endpoints
const authMiddleware = (req, res, next) => {
  // Your authentication logic here
  // If not authenticated:
  // return res.status(401).json({ message: 'Unauthorized access' });
  
  next(); // If authenticated
};

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoute); // Apply auth-specific rate limiting
app.use('/api/file-details', apiLimiter, authMiddleware, fileRoutes); // Apply API rate limiting
app.use('/api/ipfs', apiLimiter, authMiddleware, ipfsRoutes); // Apply API rate limiting
app.use("/api/share", apiLimiter, authMiddleware, shareTokenRoutes); // Apply API rate limiting

// Non-existent route handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose detailed error messages in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message || 'Something went wrong!';
    
  res.status(err.status || 500).json({
    success: false,
    message
  });
});

const PORT = process.env.PORT || 5500;

// Connect to MongoDB before starting the server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });