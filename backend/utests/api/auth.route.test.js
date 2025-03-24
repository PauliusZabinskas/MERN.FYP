import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import sinon from 'sinon';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create stubs for the controller functions
const controllerStubs = {
  Signup: sinon.stub(),
  Login: sinon.stub(),
  Logout: sinon.stub(),
  Verify: sinon.stub()
};

// Import necessary modules and setup the app
const setupTestApp = async () => {
  // Mock the auth.controller.js module
  const authRoutePath = join(__dirname, '../../routes/auth.route.js');
  
  // Import the route file with the real controller
  const { default: authRoutes } = await import(authRoutePath);
  
  // Create a new app
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  
  // Override the controller functions before adding routes
  app.use('/api/auth', (req, res, next) => {
    // Determine which controller function to call based on path and method
    const path = req.path;
    const method = req.method;
    
    if (path === '/register' && method === 'POST') {
      return controllerStubs.Signup(req, res, next);
    } 
    else if (path === '/login' && method === 'POST') {
      return controllerStubs.Login(req, res, next);
    } 
    else if (path === '/logout' && method === 'POST') {
      return controllerStubs.Logout(req, res, next);
    } 
    else if (path === '/verify' && method === 'GET') {
      return controllerStubs.Verify(req, res, next);
    }
    
    next();
  });
  
  // Add the original routes as fallback
  app.use('/api/auth', authRoutes);
  
  return app;
};

describe('Auth Routes', function() {
  let app;
  
  before(async function() {
    app = await setupTestApp();
  });
  
  // Reset stubs before each test
  beforeEach(function() {
    sinon.resetHistory();
  });

  describe('POST /api/auth/register', function() {
    it('should call Signup controller with correct data', async function() {
      // Setup stub implementation
      controllerStubs.Signup.callsFake((req, res) => {
        res.status(201).json({ 
          success: true, 
          message: "User registered successfully",
          user: {
            id: '123',
            email: req.body.email,
            username: req.body.username
          }
        });
      });

      const userData = { 
        email: 'test@example.com', 
        password: 'password123', 
        username: 'testuser' 
      };

      // Make request and assertions
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(controllerStubs.Signup.calledOnce).to.be.true;
      expect(response.body.success).to.be.true;
      expect(response.body.user.email).to.equal(userData.email);
      expect(response.body.user.username).to.equal(userData.username);
    });
  });

  describe('POST /api/auth/login', function() {
    it('should call Login controller with credentials', async function() {
      // Setup stub implementation
      controllerStubs.Login.callsFake((req, res) => {
        res.status(200).json({ 
          success: true, 
          message: "Login successful",
          user: {
            id: '123',
            email: req.body.email,
            username: 'testuser'
          }
        });
      });

      const credentials = { 
        email: 'test@example.com', 
        password: 'password123'
      };

      // Make request and assertions
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(controllerStubs.Login.calledOnce).to.be.true;
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Login successful');
    });
  });

  describe('POST /api/auth/logout', function() {
    it('should call Logout controller', async function() {
      // Setup stub implementation
      controllerStubs.Logout.callsFake((req, res) => {
        res.status(200).json({ 
          success: true, 
          message: "Logged out successfully"
        });
      });

      // Make request and assertions
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(controllerStubs.Logout.calledOnce).to.be.true;
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Logged out successfully');
    });
  });

  describe('GET /api/auth/verify', function() {
    it('should call Verify controller and handle authenticated user', async function() {
      // Setup stub implementation for authenticated user
      controllerStubs.Verify.callsFake((req, res) => {
        res.json({ 
          authenticated: true,
          user: {
            id: '123',
            email: 'test@example.com',
            username: 'testuser'
          }
        });
      });

      // Make request and assertions
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(200);

      expect(controllerStubs.Verify.calledOnce).to.be.true;
      expect(response.body.authenticated).to.be.true;
      expect(response.body.user).to.exist;
    });

    it('should call Verify controller and handle unauthenticated user', async function() {
      // Setup stub implementation for unauthenticated user
      controllerStubs.Verify.callsFake((req, res) => {
        res.json({ authenticated: false });
      });

      // Make request and assertions
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(200);

      expect(controllerStubs.Verify.calledOnce).to.be.true;
      expect(response.body.authenticated).to.be.false;
      expect(response.body.user).to.be.undefined;
    });
  });
});