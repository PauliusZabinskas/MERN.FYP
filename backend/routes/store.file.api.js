import express from 'express';
import { uploadFile, handleFileUpload, getFile } from '../controllers/store.file.controller.js';

const router = express.Router();

router.post('/', uploadFile, handleFileUpload);
router.get('/:filename', getFile); // Add this route to get the file


export default router;