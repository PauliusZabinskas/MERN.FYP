import express from 'express';
import { createFile, getFile, getFiles, updateFile, deleteFile } from '../controllers/file.controller.js';


const router = express.Router();

router.get('/:id', getFile);

router.get('/', getFiles);

router.put('/:id', updateFile);

router.post('/', createFile);

router.delete('/:id', deleteFile);

export default router;