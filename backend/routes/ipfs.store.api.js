// ipfs.routes.js
import express from 'express';
import multer from 'multer';
import { addFile, getFile } from '../controllers/ipfs.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), addFile);
router.get('/:cid', getFile);

export default router;
