import axios from 'axios';
import File from "../models/file.model.js";
import mongoose from 'mongoose';
import FormData from 'form-data';

export const getAllFileDetails = async (req, res) => {
  try {
    const files = await File.find({});
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    console.log("Failed to fetch files", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  const file = await File.findById(id);
  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  try {
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.log("Failed to fetch a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const createFileDetails = async (req, res) => {
  const fileDetails = req.body;

  if (!fileDetails.name || !fileDetails.description || !fileDetails.owner) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded.' });
  }

  try {
    // Upload the file to IPFS and get the CID
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    console.log('Sending file to IPFS:', req.file.originalname);
    
    // Fix the IPFS endpoint to include the "add" action
    const ipfsResponse = await axios.post('http://localhost:5001/api/v0/add', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('IPFS response:', ipfsResponse.data);

    // Extract the CID from the IPFS response
    const fileCid = ipfsResponse.data.Hash || ipfsResponse.data.Cid;

    if (!fileCid) {
      return res.status(500).send({ message: 'Failed to retrieve CID from IPFS response' });
    }

    // Add the CID to the file details
    const newFile = new File({ ...fileDetails, cid: fileCid });

    await newFile.save();
    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    console.log("Failed to upload a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const updateFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }
  const file = await File.findById(id);

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  try {
    const updatedFile = await File.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedFile });
  } catch (error) {
    console.log("Failed to update a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const deleteFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  const file = await File.findById(id);

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  try {
    await File.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.log("Failed to delete a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}