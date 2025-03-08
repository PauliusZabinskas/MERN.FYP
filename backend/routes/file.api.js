import express from 'express';
import multer from 'multer';
import { createFileDetails, getAllFileDetails, getFileDetails, updateFileDetails, deleteFileDetails } from '../controllers/mongoDB.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), createFileDetails);
router.get('/', getAllFileDetails);
router.get('/:id', getFileDetails);
router.put('/:id', updateFileDetails);
router.delete('/:id', deleteFileDetails);

export default router;