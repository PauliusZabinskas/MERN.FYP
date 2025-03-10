// ipfs.routes.js
import express from 'express';
import multer from 'multer';
import { addFile, getFile, getAllFiles, downloadFile } from '../controllers/ipfs.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), addFile);
router.get('/:cid', getFile);
router.get('/', getAllFiles); // Add this route to get all files
router.get('/download/:cid', downloadFile);

export default router;
