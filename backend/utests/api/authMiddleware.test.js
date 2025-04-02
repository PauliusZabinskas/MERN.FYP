import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { userVerification, validateShareToken, requireAuthOrValidShare } from '../../middlewares/authMiddleware.js';
import User from '../../models/userModel.js';

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
      query: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.spy();
  });
  
  afterEach(() => {
    sinon.restore();
    // Clean up any temporary globals
    delete global.verifyShareToken;
    delete global.File;
  });
  
  describe('userVerification', () => {
    it('should return 401 if no token is provided', () => {
      // No cookie or auth header set
      userVerification(req, res, next);
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWithMatch({ status: false, message: "Authentication required" })).to.be.true;
    });
    
    it('should return 401 if token verification fails', () => {
      req.cookies.token = 'invalid-token';
      const jwtVerifyStub = sinon.stub(jwt, 'verify').callsFake((token, key, callback) => {
        callback(new Error('invalid token'), null);
      });
      
      userVerification(req, res, next);
      
      expect(jwtVerifyStub.called).to.be.true;
      expect(res.status.calledWith(401)).to.be.true;
      expect(
        res.json.calledWithMatch({ status: false, message: "Invalid or expired token" })
      ).to.be.true;
    });
    
    it('should attach user and call next if token is valid and user exists', async () => {
      req.cookies.token = 'valid-token';
      const fakeUser = { _id: '123', email: 'test@example.com' };
      sinon.stub(jwt, 'verify').callsFake((token, key, callback) => {
        callback(null, { id: fakeUser._id });
      });
      sinon.stub(User, 'findById').resolves(fakeUser);
      
      await userVerification(req, res, next);
      
      expect(req.user).to.equal(fakeUser);
      expect(next.called).to.be.true;
    });
    
    it('should return 401 if user is not found', async () => {
      req.cookies.token = 'valid-token';
      sinon.stub(jwt, 'verify').callsFake((token, key, callback) => {
        callback(null, { id: 'nonexistent' });
      });
      sinon.stub(User, 'findById').resolves(null);
      
      await userVerification(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(
        res.json.calledWithMatch({ status: false, message: "User not found" })
      ).to.be.true;
    });
    
    it('should return 500 if a database error occurs', async () => {
      req.cookies.token = 'valid-token';
      sinon.stub(jwt, 'verify').callsFake((token, key, callback) => {
        callback(null, { id: 'someid' });
      });
      sinon.stub(User, 'findById').rejects(new Error('DB Error'));
      
      await userVerification(req, res, next);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(
        res.json.calledWithMatch({ status: false, message: "Database error" })
      ).to.be.true;
    });
  });
  
  describe('validateShareToken', () => {
    // To test this middleware, we assume that authMiddleware.js calls a helper function
    // named verifyShareToken. We expose a dummy global version that we can stub.
    beforeEach(() => {
      global.verifyShareToken = () => null;
    });
    
    it('should call next if no token is provided', async () => {
      req.query.token = null;
      await validateShareToken(req, res, next);
      expect(next.called).to.be.true;
      expect(req.shareData).to.be.undefined;
    });
    
    it('should not attach shareData if token is invalid', async () => {
      req.query.token = 'invalid-token';
      const verifyShareTokenStub = sinon.stub(global, 'verifyShareToken').returns(null);
      await validateShareToken(req, res, next);
      expect(verifyShareTokenStub.called).to.be.true;
      expect(req.shareData).to.be.undefined;
      expect(next.called).to.be.true;
    });
    
    it('should attach shareData if token is valid and file exists', async () => {
      req.query.token = 'valid-token';
      const fakeDecoded = { fileId: 'file123', owner: 'owner@example.com', recipient: 'recipient@example.com', permissions: ['read'] };
      const verifyShareTokenStub = sinon.stub(global, 'verifyShareToken').returns(fakeDecoded);
      
      // Stub File.findById to simulate file existence. (Assume File is used in validateShareToken.)
      global.File = {
        findById: sinon.stub().resolves({ _id: fakeDecoded.fileId, name: 'Test File' })
      };
      
      await validateShareToken(req, res, next);
      
      expect(verifyShareTokenStub.called).to.be.true;
      expect(global.File.findById.calledWith(fakeDecoded.fileId)).to.be.true;
      expect(req.shareData).to.deep.equal({
        isValid: true,
        fileId: fakeDecoded.fileId,
        owner: fakeDecoded.owner,
        recipient: fakeDecoded.recipient,
        permissions: fakeDecoded.permissions
      });
      expect(next.called).to.be.true;
    });
  });
  
  describe('requireAuthOrValidShare', () => {
    let middleware;
    beforeEach(() => {
      middleware = requireAuthOrValidShare('read');
    });
    
    it('should call next if user token is valid', async () => {
      // Set valid user token in cookies
      req.cookies.token = 'valid-user-token';
      const fakeUser = { _id: 'user123', email: 'user@example.com' };
      sinon.stub(jwt, 'verify').returns({ id: fakeUser._id });
      sinon.stub(User, 'findById').resolves(fakeUser);
      
      await middleware(req, res, next);
      
      expect(req.user).to.equal(fakeUser);
      expect(next.called).to.be.true;
    });
    
    it('should call next if valid share token with required permission is present', async () => {
      // Simulate invalid user token
      req.cookies.token = 'invalid-token';
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));
      
      req.shareData = {
        isValid: true,
        fileId: 'file123',
        owner: 'owner@example.com',
        recipient: 'user@example.com',
        permissions: ['read']
      };
      
      await middleware(req, res, next);
      
      expect(next.called).to.be.true;
    });
    
    it('should return 401 if neither valid user token nor valid share token exists', async () => {
      req.cookies.token = 'invalid-token';
      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));
      // No shareData attached
      await middleware(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(
        res.json.calledWithMatch({
          status: false,
          message: "Authentication required or valid share token with sufficient permissions"
        })
      ).to.be.true;
    });
  });
});