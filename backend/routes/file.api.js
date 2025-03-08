import express from 'express';
import { createFileDetails, getAllFileDetails, getFileDetails, updateFileDetails, deleteFileDetails } from '../controllers/mongoDB.controller.js';


const router = express.Router();

router.get('/:id', getFileDetails);

router.get('/', getAllFileDetails);

router.put('/:id', updateFileDetails);

router.post('/', createFileDetails);

router.delete('/:id', deleteFileDetails);

export default router;