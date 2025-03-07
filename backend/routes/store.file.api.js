import express from 'express';
import { uploadFile, handleFileUpload, getFile, getAllFiles, deleteFile } from '../controllers/store.file.controller.js';

const router = express.Router();

router.post('/', uploadFile, handleFileUpload);
router.get('/:filename', getFile); 
router.get('/', getAllFiles); 
router.delete('/:filename', deleteFile);


export default router;