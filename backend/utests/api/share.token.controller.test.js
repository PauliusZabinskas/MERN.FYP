import * as chai from 'chai';
import express from 'express';
import sinon from 'sinon';
import chaiHttp from 'chai-http';
import { createShareToken, verifyShare, getSharedWithMe } from '../../controllers/shareToken.controller.js';
import File from '../../models/file.model.js';
import { tokenUtils } from '../../util/tokenUtilWrapper.js';

chai.use(chaiHttp);
const { expect } = chai;

describe('Share Token Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, user: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createShareToken', () => {
    it('should return 400 if fileId or recipient is missing', async () => {
      // Set an authenticated user so that we proceed beyond auth check.
      req.user = { email: 'owner@example.com' };
      req.body = {}; // missing fileId and recipient

      await createShareToken(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'File ID and recipient email are required'
        })
      ).to.be.true;
    });

    it('should return 404 if file does not exist', async () => {
      req.user = { email: 'owner@example.com' };
      req.body = { fileId: 'nonexistentId', recipient: 'test@example.com' };
      sinon.stub(File, 'findById').resolves(null);

      await createShareToken(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'File not found'
        })
      ).to.be.true;
    });

    it('should return 403 if user is not file owner', async () => {
      req.user = { email: 'notowner@example.com' };
      req.body = { fileId: 'existingId', recipient: 'test@example.com' };

      const mockFile = { _id: 'existingId', owner: 'owner@example.com' };
      sinon.stub(File, 'findById').resolves(mockFile);

      await createShareToken(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'Access denied: You are not the owner of this file'
        })
      ).to.be.true;
    });

    it('should return 200 and token on successful token creation', async () => {
      req.user = { email: 'owner@example.com' };
      req.body = { fileId: 'existingId', recipient: 'recipient@example.com', permissions: ['read'] };

      const mockFile = {
        _id: 'existingId',
        owner: 'owner@example.com',
        tokenSharedWith: [],
        save: sinon.stub().resolves()
      };

      sinon.stub(File, 'findById').resolves(mockFile);
      sinon.stub(tokenUtils, 'generateShareToken').returns('test-token');

      await createShareToken(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: true,
          shareToken: 'test-token'
        })
      ).to.be.true;
    });
  });

  describe('verifyShare', () => {
    it('should return 400 if token is missing', async () => {
      // Set an authenticated user.
      req.user = { email: 'recipient@example.com' };
      req.query = {}; // missing token

      await verifyShare(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'Share token is required'
        })
      ).to.be.true;
    });

    it('should return 401 if token is invalid', async () => {
      req.user = { email: 'recipient@example.com' };
      req.query = { token: 'invalid-token' };
      sinon.stub(tokenUtils, 'verifyShareToken').returns(null);

      await verifyShare(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'Invalid or expired share token'
        })
      ).to.be.true;
    });

    it('should return 404 if file does not exist', async () => {
      req.user = { email: 'recipient@example.com' };
      req.query = { token: 'valid-token' };
      const decoded = { fileId: 'nonexistentId', recipient: 'recipient@example.com' };

      sinon.stub(tokenUtils, 'verifyShareToken').returns(decoded);
      sinon.stub(File, 'findById').resolves(null);

      await verifyShare(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'Shared file not found'
        })
      ).to.be.true;
    });

    it('should return 403 if token not issued for current user', async () => {
      req.user = { email: 'wrong@example.com' };
      req.query = { token: 'valid-token' };
      const decoded = { fileId: 'existingId', recipient: 'recipient@example.com' };
      const mockFile = { _id: 'existingId', name: 'test.txt', cid: 'test-cid' };

      sinon.stub(tokenUtils, 'verifyShareToken').returns(decoded);
      sinon.stub(File, 'findById').resolves(mockFile);

      await verifyShare(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'This share token was not issued for your account'
        })
      ).to.be.true;
    });

    it('should return 200 and file info on successful verification', async () => {
      req.user = { email: 'recipient@example.com' };
      req.query = { token: 'valid-token' };
      const decoded = {
        fileId: 'existingId',
        recipient: 'recipient@example.com',
        permissions: ['read', 'download'],
        owner: 'owner@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const mockFile = { _id: 'existingId', name: 'test.txt', cid: 'test-cid' };

      sinon.stub(tokenUtils, 'verifyShareToken').returns(decoded);
      sinon.stub(File, 'findById').resolves(mockFile);

      await verifyShare(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: true,
          fileId: 'existingId',
          fileName: 'test.txt',
          cid: 'test-cid',
          permissions: ['read', 'download'],
          owner: 'owner@example.com',
          expiresAt: decoded.exp
        })
      ).to.be.true;
    });
  });

  describe('getSharedWithMe', () => {
    it('should return 200 and empty array if no files shared', async () => {
      req.user = { email: 'user@example.com' };
      sinon.stub(File, 'find').resolves([]);
      await getSharedWithMe(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, files: [] })).to.be.true;
    });

    it('should return 200 and shared files on success', async () => {
      req.user = { email: 'user@example.com' };
      const mockFiles = [
        { _id: '123', name: 'file1.txt', owner: 'owner1@example.com' },
        { _id: '456', name: 'file2.txt', owner: 'owner2@example.com' }
      ];
      sinon.stub(File, 'find').resolves(mockFiles);
      await getSharedWithMe(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, files: mockFiles })).to.be.true;
    });

    it('should return 500 on database error', async () => {
      req.user = { email: 'user@example.com' };
      sinon.stub(File, 'find').rejects(new Error('Database error'));
      await getSharedWithMe(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(
        res.json.calledWithMatch({
          success: false,
          message: 'Failed to retrieve shared files'
        })
      ).to.be.true;
    });
  });
});