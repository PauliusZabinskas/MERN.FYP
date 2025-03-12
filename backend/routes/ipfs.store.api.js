// ipfs.routes.js
import express from 'express';
import multer from 'multer';
import { addFile, getFile, getAllFiles, downloadFile } from '../controllers/ipfs.controller.js';
import { userVerification } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', userVerification, upload.single('file'), addFile );
router.get('/:cid', userVerification, getFile );
router.get('/', userVerification, getAllFiles ); // Add this route to get all files
router.get('/download/:cid', userVerification, downloadFile );

export default router;
