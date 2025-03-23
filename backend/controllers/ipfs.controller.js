import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import File from "../models/file.model.js";
import { verifyShareToken, checkShareAccess } from "../util/secretToken.js";

// IPFS node endpoint
const ipfsEndpoint = 'http://localhost:5001/api/v0';

// Function to add a file to IPFS
export const addFile = async (req, res) => {
  try {
    // This function is already protected by auth middleware
    // The user must be authenticated to upload files
    
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Create a form data object
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    // Add the file to IPFS
    const response = await axios.post(`${ipfsEndpoint}/add`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const fileCid = response.data.Hash;
    res.send({ cid: fileCid });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('An error occurred while uploading the file.');
  }
};

// Function to retrieve a file from IPFS - Check ownership first
export const getFile = async (req, res) => {
  try {
    const { cid } = req.params;
    
    // Get share token if provided
    const shareToken = req.query.token || 
                      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                        ? req.headers.authorization.split(' ')[1] 
                        : null);
    
    // Check if file exists
    const file = await File.findOne({ cid });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Determine access method: user authentication or share token
    let hasAccess = false;
    
    // Method 1: Authenticated user is owner or in sharedWith
    if (req.user) {
      const isOwner = file.owner === req.user.email;
      const isShared = file.sharedWith.includes(req.user.email);
      hasAccess = isOwner || isShared;
    }
    
    // Method 2: Valid share token with read permission
    if (!hasAccess && shareToken) {
      // Check if the share token grants read access to this file
      if (checkShareAccess(shareToken, file._id.toString(), req.query.recipient || '', 'read')) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this file'
      });
    }

    // If access is granted, retrieve the file from IPFS
    const response = await axios.post(`${ipfsEndpoint}/cat`, null, {
      params: { arg: cid },
      responseType: 'arraybuffer',
    });

    res.send(response.data);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the file'
    });
  }
};

// Download file after verifying ownership or share token
export const downloadFile = async (req, res) => {
  try {
    const { cid } = req.params;
    
    // Get share token if provided
    const shareToken = req.query.token || 
                      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                        ? req.headers.authorization.split(' ')[1] 
                        : null);
    
    // Check if file exists
    const file = await File.findOne({ cid });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Determine access method: user authentication or share token
    let hasAccess = false;
    
    // Method 1: Authenticated user is owner or in sharedWith
    if (req.user) {
      const isOwner = file.owner === req.user.email;
      const isShared = file.sharedWith.includes(req.user.email);
      hasAccess = isOwner || isShared;
    }
    
    // Method 2: Valid share token with download permission
    if (!hasAccess && shareToken) {
      // Check if the share token grants download access to this file
      if (checkShareAccess(shareToken, file._id.toString(), req.query.recipient || '', 'download')) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to download this file'
      });
    }

    // If access is granted, download the file from IPFS
    const response = await axios.post(`${ipfsEndpoint}/cat`, null, {
      params: { arg: cid },
      responseType: 'arraybuffer',
    });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(response.data);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download file'
    });
  }
};

// Only show files owned by the current user
export const getAllFiles = async (req, res) => {
  try {
    // Find only files where the owner matches the user's email
    const files = await File.find({ owner: req.user.email });
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    });
  }
};