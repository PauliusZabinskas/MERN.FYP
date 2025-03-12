import express from 'express';
import multer from 'multer';
import { createFileDetails, getAllFileDetails, getFileDetails, updateFileDetails, deleteFileDetails } from '../controllers/mongoDB.controller.js';
import { userVerification } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply userVerification middleware BEFORE the controller function
router.post('/', userVerification, upload.single('file'), createFileDetails);
router.get('/', userVerification, getAllFileDetails);
router.get('/:id', userVerification, getFileDetails);
router.put('/:id', userVerification, updateFileDetails);
router.delete('/:id', userVerification, deleteFileDetails);

export default router;