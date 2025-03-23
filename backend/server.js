import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import fileRoutes from './routes/file.api.js';
import ipfsRoutes from './routes/ipfs.store.api.js';
import authRoute from './routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shareTokenRoutes from "./routes/share.token.api.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/file-details', fileRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use("/api/share", shareTokenRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;

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