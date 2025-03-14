import axios from 'axios';
import File from "../models/file.model.js";
import mongoose from 'mongoose';
import FormData from 'form-data';

// Only return files owned by the current user
export const getAllFileDetails = async (req, res) => {
  try {
    // Get the user from auth middleware
    const user = req.user;
    
    // Find only files where the owner matches the user's email
    const files = await File.find({ owner: user.email });
    
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    console.log("Failed to fetch files", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify ownership before returning file details
export const getFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  try {
    const file = await File.findById(id);
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check if the current user is the owner
    if (file.owner !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not own this file' 
      });
    }
    
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.log("Failed to fetch a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Set the owner automatically when creating a file
export const createFileDetails = async (req, res) => {
  const fileDetails = req.body;

  if (!fileDetails.description) {
    return res.status(400).json({ 
      success: false,
      message: 'Description is required'
    });
  }

  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    // Use the authenticated user's email as the owner
    const owner = req.user.email;
    
    // Upload the file to IPFS and get the CID
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    console.log('Sending file to IPFS:', req.file.originalname);
    
    const ipfsResponse = await axios.post('http://localhost:5001/api/v0/add', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('IPFS response:', ipfsResponse.data);

    // Extract the CID from the IPFS response
    const fileCid = ipfsResponse.data.Hash || ipfsResponse.data.Cid;

    if (!fileCid) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve CID from IPFS response'
      });
    }

    // Create file with owner set to the current user's email
    const newFile = new File({
      name: req.file.originalname,
      description: fileDetails.description,
      cid: fileCid,
      owner: owner
    });

    await newFile.save();
    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    console.log("Failed to upload a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify ownership before updating file
export const updateFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  try {
    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check if the current user is the owner
    if (file.owner !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not own this file' 
      });
    }
    
    // Allow updating description but not the owner
    const updatedData = {
      description: req.body.description
    };
    
    const updatedFile = await File.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedFile });
  } catch (error) {
    console.log("Failed to update a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify ownership before deleting file
export const deleteFileDetails = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  try {
    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Check if the current user is the owner
    if (file.owner !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not own this file' 
      });
    }

    await File.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.log("Failed to delete a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}