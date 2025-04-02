import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockCreateShareToken = sinon.stub();
const mockVerifyShare = sinon.stub();
const mockGetSharedWithMe = sinon.stub();

// Mock controllers with dependency injection
function setupControllers() {
  return {
    createShareToken: (req, res) => mockCreateShareToken(req, res),
    verifyShare: (req, res) => mockVerifyShare(req, res),
    getSharedWithMe: (req, res) => mockGetSharedWithMe(req, res),
  };
}

// Create a mock Express app with routes
function setupApp(authMiddlewareMock) {
  const app = express();
  app.use(express.json());

  const router = express.Router();

  // Apply auth middleware
  router.use(authMiddlewareMock || ((req, res, next) => {
    req.user = { email: 'test@example.com' };
    next();
  }));

  // Inject mocked controllers
  const controllers = setupControllers();
  router.post('/', controllers.createShareToken);
  router.get('/verify', controllers.verifyShare);
  router.get('/received', controllers.getSharedWithMe);

  app.use('/api/share', router);
  return app;
}

describe('Share Token API Routes', () => {
  let app;

  beforeEach(() => {
    // Reset all stubs before each test
    sinon.resetHistory();
  });

  describe('POST /', () => {
    it('should call createShareToken controller when POST request is made', async () => {
      mockCreateShareToken.callsFake((req, res) => {
        res.status(200).json({ success: true, shareToken: 'test-token' });
      });

      app = setupApp();

      const response = await request(app)
        .post('/api/share')
        .send({ fileId: 'testFileId', recipient: 'recipient@example.com' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.shareToken).to.equal('test-token');
      expect(mockCreateShareToken.calledOnce).to.be.true;
    });
  });

  describe('GET /verify', () => {
    it('should call verifyShare controller when verify endpoint is accessed', async () => {
      mockVerifyShare.callsFake((req, res) => {
        res.status(200).json({
          success: true,
          fileId: 'testFileId',
          permissions: ['read', 'download'],
        });
      });

      app = setupApp();

      const response = await request(app)
        .get('/api/share/verify')
        .query({ token: 'test-token' });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.fileId).to.equal('testFileId');
      expect(mockVerifyShare.calledOnce).to.be.true;
    });
  });

  describe('GET /received', () => {
    it('should call getSharedWithMe controller when received endpoint is accessed', async () => {
      const mockFiles = [
        { _id: 'file1', name: 'shared1.txt' },
        { _id: 'file2', name: 'shared2.txt' },
      ];

      mockGetSharedWithMe.callsFake((req, res) => {
        res.status(200).json({ success: true, data: mockFiles });
      });

      app = setupApp();

      const response = await request(app).get('/api/share/received');

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.deep.equal(mockFiles);
      expect(mockGetSharedWithMe.calledOnce).to.be.true;
    });
  });

  describe('Authentication middleware', () => {
    it('should apply authentication middleware to all routes', async () => {
      let authMiddlewareSpy = false;

      const authMiddlewareMock = (req, res, next) => {
        authMiddlewareSpy = true;
        req.user = { email: 'test@example.com' };
        next();
      };

      mockGetSharedWithMe.callsFake((req, res) => {
        res.status(200).json({ success: true });
      });

      app = setupApp(authMiddlewareMock);

      await request(app).get('/api/share/received');

      expect(authMiddlewareSpy).to.be.true;
      expect(mockGetSharedWithMe.calledOnce).to.be.true;
    });

    it('should not proceed if authentication fails', async () => {
      const authMiddlewareFailMock = (req, res, next) => {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
      };

      app = setupApp(authMiddlewareFailMock);

      const response = await request(app).get('/api/share/received');

      expect(response.status).to.equal(401);
      expect(response.body.success).to.be.false;
      expect(mockGetSharedWithMe.called).to.be.false;
    });
  });
});