import express from 'express';
import multer from 'multer';
import { addFile, getFile, getAllFiles, downloadFile } from '../controllers/ipfs.controller.js';
import { userVerification, validateShareToken, requireAuthOrValidShare } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Routes that require full authentication
router.post('/', userVerification, upload.single('file'), addFile);
router.get('/', userVerification, getAllFiles);

// Routes that can work with either authentication or share token
// Apply validateShareToken first to check for share tokens
// Then apply requireAuthOrValidShare to ensure either auth or valid share token
router.get('/:cid', validateShareToken, requireAuthOrValidShare('read'), getFile);
router.get('/download/:cid', validateShareToken, requireAuthOrValidShare('download'), downloadFile);

export default router;