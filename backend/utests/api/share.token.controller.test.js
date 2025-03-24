// import { expect } from 'chai';
// import sinon from 'sinon';
// import { createShareToken, verifyShare, getSharedWithMe } from '../../controllers/shareToken.controller.js';

// describe('Share Token Controller', () => {
//   describe('createShareToken', () => {
//     it('should generate a share token and return it in the response', async () => {
//       const req = {
//         body: {
//           fileId: 'testFileId',
//           recipient: 'recipient@example.com',
//         },
//         user: {
//           email: 'owner@example.com',
//         },
//       };
//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.stub(),
//       };

//       const generateShareTokenStub = sinon.stub().returns('test-token');

//       await createShareToken({ generateShareToken: generateShareTokenStub })(req, res);

//       expect(generateShareTokenStub.calledOnceWith({
//         fileId: 'testFileId',
//         owner: 'owner@example.com',
//         recipient: 'recipient@example.com',
//         permissions: ['read', 'download'],
//       })).to.be.true;
//       expect(res.status.calledOnceWith(200)).to.be.true;
//       expect(res.json.calledOnceWith({ success: true, shareToken: 'test-token' })).to.be.true;
//     });
//   });

//   describe('verifyShare', () => {
//     it('should verify a share token and return file details', async () => {
//       const req = {
//         query: {
//           token: 'test-token',
//         },
//       };
//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.stub(),
//       };

//       const verifyShareTokenStub = sinon.stub().returns({
//         fileId: 'testFileId',
//         permissions: ['read', 'download'],
//       });

//       await verifyShare({ verifyShareToken: verifyShareTokenStub })(req, res);

//       expect(verifyShareTokenStub.calledOnceWith('test-token')).to.be.true;
//       expect(res.status.calledOnceWith(200)).to.be.true;
//       expect(
//         res.json.calledOnceWith({
//           success: true,
//           fileId: 'testFileId',
//           permissions: ['read', 'download'],
//         })
//       ).to.be.true;
//     });

//     it('should return an error if the token is invalid', async () => {
//       const req = {
//         query: {
//           token: 'invalid-token',
//         },
//       };
//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.stub(),
//       };

//       const verifyShareTokenStub = sinon.stub().throws(new Error('Invalid token'));

//       await verifyShare({ verifyShareToken: verifyShareTokenStub })(req, res);

//       expect(verifyShareTokenStub.calledOnceWith('invalid-token')).to.be.true;
//       expect(res.status.calledOnceWith(400)).to.be.true;
//       expect(res.json.calledOnceWith({ success: false, message: 'Invalid token' })).to.be.true;
//     });
//   });

//   describe('getSharedWithMe', () => {
//     it('should return a list of files shared with the user', async () => {
//       const req = {
//         user: {
//           email: 'test@example.com',
//         },
//       };
//       const res = {
//         status: sinon.stub().returnsThis(),
//         json: sinon.stub(),
//       };

//       const mockFiles = [
//         { _id: 'file1', name: 'shared1.txt' },
//         { _id: 'file2', name: 'shared2.txt' },
//       ];

//       const getSharedFilesStub = sinon.stub().resolves(mockFiles);

//       await getSharedWithMe({ getSharedFiles: getSharedFilesStub })(req, res);

//       expect(getSharedFilesStub.calledOnceWith('test@example.com')).to.be.true;
//       expect(res.status.calledOnceWith(200)).to.be.true;
//       expect(res.json.calledOnceWith({ success: true, data: mockFiles })).to.be.true;
//     });
//   });
// });