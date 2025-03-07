// ipfs.routes.js
import express from 'express';
import multer from 'multer';
import { addFile, getFile, getAllFiles } from '../controllers/ipfs.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), addFile);
router.get('/:cid', getFile);
router.get('/', getAllFiles); // Add this route to get all files

export default router;
