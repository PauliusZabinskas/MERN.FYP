import express from 'express';
import multer from 'multer';
import { 
  createFileDetails, 
  getAllFileDetails, 
  getFileDetails, 
  updateFileDetails, 
  deleteFileDetails,
  shareFile,
  removeSharing
} from '../controllers/mongoDB.controller.js';
import { userVerification } from '../middlewares/authMiddleware.js';

const router = express.Router();
// Set safe file size limits to prevent DoS attacks
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Maximum 1 file per request
  }
});

// Apply userVerification middleware BEFORE the controller function
router.post('/', userVerification, upload.single('file'), createFileDetails);
router.get('/', userVerification, getAllFileDetails);
router.get('/:id', userVerification, getFileDetails);
router.put('/:id', userVerification, updateFileDetails);
router.delete('/:id', userVerification, deleteFileDetails);

// Add new routes for sharing
router.post('/:id/share', userVerification, shareFile);
router.post('/:id/unshare', userVerification, removeSharing);

export default router;