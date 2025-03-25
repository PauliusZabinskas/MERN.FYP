import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import mongoose from 'mongoose';
import FormData from 'form-data';
import {
  getAllFileDetails,
  getFileDetails,
  createFileDetails,
  updateFileDetails,
  deleteFileDetails,
  shareFile,
  removeSharing
} from '../../controllers/mongoDB.controller.js';
import File from '../../models/file.model.js';

describe('MongoDB Controller', () => {
  let req, res;
  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllFileDetails', () => {
    it('should clean up expired tokens and return files for user', async () => {
      req.user = { email: 'test@example.com' };
      const fakeFiles = [
        // Simulate mongoose file documents (assume ._doc contains file data)
        { _doc: { name: 'file1' }, owner: 'test@example.com', sharedWith: [], tokenSharedWith: [] },
        { _doc: { name: 'file2' }, owner: 'other@example.com', sharedWith: ['test@example.com'], tokenSharedWith: [] }
      ];
      const updateManyStub = sinon.stub(File, 'updateMany').resolves();
      const findStub = sinon.stub(File, 'find').resolves(fakeFiles);

      await getAllFileDetails(req, res);

      expect(updateManyStub.called).to.be.true;
      expect(findStub.called).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, data: sinon.match.array })).to.be.true;
    });

    it('should return 500 if an error occurs', async () => {
      req.user = { email: 'test@example.com' };
      sinon.stub(File, 'updateMany').rejects(new Error('DB error'));
      await getAllFileDetails(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'DB error' })).to.be.true;
    });
  });

  describe('getFileDetails', () => {
    it('should return 400 for an invalid file ID', async () => {
      req.params = { id: 'invalid-id' };
      await getFileDetails(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'Invalid file ID' })).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.user = { email: 'user@example.com' };
      sinon.stub(File, 'findById').resolves(null);
      await getFileDetails(req, res);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'File not found' })).to.be.true;
    });

    it('should return 403 if user is not owner and file is not shared with them', async () => {
      const fileId = new mongoose.Types.ObjectId().toString();
      req.params = { id: fileId };
      req.user = { email: 'user@example.com' };
      const fakeFile = { _doc: { name: 'fileX' }, owner: 'other@example.com', sharedWith: [] };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await getFileDetails(req, res);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'Access denied: You do not have permission to access this file' })).to.be.true;
    });

    it('should return file details if user has access', async () => {
      const fileId = new mongoose.Types.ObjectId().toString();
      req.params = { id: fileId };
      req.user = { email: 'user@example.com' };
      // User is owner
      const fakeFile = { _doc: { name: 'fileX' }, owner: 'user@example.com', sharedWith: [] };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await getFileDetails(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, data: sinon.match.object })).to.be.true;
    });
  });

  describe('createFileDetails', () => {
    it('should return 400 if description is missing', async () => {
      req.body = {};
      req.file = { buffer: Buffer.from('data'), originalname: 'test.txt' };
      await createFileDetails(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'Description is required' })).to.be.true;
    });

    it('should return 400 if file is not provided', async () => {
      req.body = { description: 'desc' };
      await createFileDetails(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWithMatch({ success: false, message: 'No file uploaded' })).to.be.true;
    });

    it('should create file details and return 201 on success', async () => {
      req.user = { email: 'owner@example.com' };
      req.body = { description: 'desc' };
      req.file = { buffer: Buffer.from('data'), originalname: 'test.txt' };

      // Stub axios.post to simulate a successful IPFS upload
      const axiosStub = sinon.stub(axios, 'post').resolves({ data: { Hash: 'fake-cid' } });
      // Stub file save (simulate mongoose Document.save)
      const fakeSavedFile = { _doc: { name: 'test.txt', description: 'desc' }, owner: 'owner@example.com' };
      sinon.stub(File.prototype, 'save').resolves(fakeSavedFile);

      await createFileDetails(req, res);
      expect(axiosStub.called).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, data: fakeSavedFile })).to.be.true;
    });
  });

  describe('updateFileDetails', () => {
    it('should return 400 for an invalid file ID', async () => {
      req.params = { id: 'invalid-id' };
      await updateFileDetails(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      sinon.stub(File, 'findById').resolves(null);
      await updateFileDetails(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('should return 403 if current user is not owner', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'user@example.com' };
      const fakeFile = { owner: 'other@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await updateFileDetails(req, res);
      expect(res.status.calledWith(403)).to.be.true;
    });

    it('should update file details and return 200 on success', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'owner@example.com' };
      req.body = { description: 'new desc' };
      const fakeFile = { owner: 'owner@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      const updatedFile = { _doc: { description: 'new desc' } };
      sinon.stub(File, 'findByIdAndUpdate').resolves(updatedFile);
      await updateFileDetails(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, data: updatedFile })).to.be.true;
    });
  });

  describe('deleteFileDetails', () => {
    it('should return 400 for an invalid file ID', async () => {
      req.params = { id: 'invalid-id' };
      await deleteFileDetails(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      sinon.stub(File, 'findById').resolves(null);
      await deleteFileDetails(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('should return 403 if current user is not owner', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'user@example.com' };
      const fakeFile = { owner: 'other@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await deleteFileDetails(req, res);
      expect(res.status.calledWith(403)).to.be.true;
    });

    it('should delete the file and return 200 on success', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'owner@example.com' };
      const fakeFile = { owner: 'owner@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      sinon.stub(File, 'findByIdAndDelete').resolves();
      await deleteFileDetails(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ success: true, message: 'File deleted successfully' })).to.be.true;
    });
  });

  describe('shareFile', () => {
    it('should return 400 for an invalid file ID', async () => {
      req.params = { id: 'invalid-id' };
      await shareFile(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 400 if emails is not provided as an array', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { emails: 'not-an-array' };
      await shareFile(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { emails: ['test@example.com'] };
      sinon.stub(File, 'findById').resolves(null);
      await shareFile(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('should return 403 if current user is not the owner', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'user@example.com' };
      req.body = { emails: ['test@example.com'] };
      const fakeFile = { owner: 'other@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await shareFile(req, res);
      expect(res.status.calledWith(403)).to.be.true;
    });

    it('should share file successfully and return 200', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.user = { email: 'owner@example.com' };
      req.body = { emails: ['share@example.com'] };
      const fakeFile = { owner: 'owner@example.com', sharedWith: [] };
      sinon.stub(File, 'findById').resolves(fakeFile);
      const updatedFile = { sharedWith: ['share@example.com'] };
      sinon.stub(File, 'findByIdAndUpdate').resolves(updatedFile);
      await shareFile(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({
        success: true,
        message: 'File shared successfully',
        data: updatedFile
      })).to.be.true;
    });
  });

  describe('removeSharing', () => {
    it('should return 400 for an invalid file ID', async () => {
      req.params = { id: 'invalid-id' };
      await removeSharing(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 400 if emails is not provided as an array', async () => {
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { emails: 'not-an-array' };
      await removeSharing(req, res);
      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 404 if file not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { emails: ['test@example.com'] };
      sinon.stub(File, 'findById').resolves(null);
      await removeSharing(req, res);
      expect(res.status.calledWith(404)).to.be.true;
    });

    it('should return 403 if current user is not the owner', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { emails: ['test@example.com'] };
      req.user = { email: 'user@example.com' };
      const fakeFile = { owner: 'other@example.com' };
      sinon.stub(File, 'findById').resolves(fakeFile);
      await removeSharing(req, res);
      expect(res.status.calledWith(403)).to.be.true;
    });

    it('should remove sharing and return 200 on success', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      req.params = { id };
      req.body = { emails: ['share@example.com'] };
      req.user = { email: 'owner@example.com' };
      const fakeFile = { owner: 'owner@example.com', sharedWith: ['share@example.com', 'other@example.com'] };
      sinon.stub(File, 'findById').resolves(fakeFile);
      const updatedFile = { sharedWith: ['other@example.com'] };
      sinon.stub(File, 'findByIdAndUpdate').resolves(updatedFile);
      await removeSharing(req, res);
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({
        success: true,
        message: 'Sharing permissions removed successfully',
        data: updatedFile
      })).to.be.true;
    });
  });
});