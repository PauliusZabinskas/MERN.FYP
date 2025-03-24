import axios from 'axios';
import File from "../models/file.model.js";
import mongoose from 'mongoose';
import FormData from 'form-data';

// Only return files owned by the current user
export const getAllFileDetails = async (req, res) => {
  try {
    // Get the user from auth middleware
    const user = req.user;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // First, clean up expired token shares from all files
    await File.updateMany(
      { "tokenSharedWith.tokenExp": { $lt: currentTime } },
      { $pull: { tokenSharedWith: { tokenExp: { $lt: currentTime } } } }
    );
    
    // Find files where user is the owner OR where user's email is in the sharedWith array
    // OR where user's email is in a non-expired tokenSharedWith entry
    const files = await File.find({ 
      $or: [
        { owner: user.email },
        { sharedWith: user.email },
        { 
          "tokenSharedWith": { 
            $elemMatch: { 
              recipient: user.email, 
              tokenExp: { $gt: currentTime } 
            } 
          } 
        }
      ]
    });
    
    // Mark which files are owned vs shared
    const filesWithAccess = files.map(file => {
      const isOwner = file.owner === user.email;
      const isShared = file.sharedWith.includes(user.email);
      const isTokenShared = file.tokenSharedWith?.some(share => 
        share.recipient === user.email && share.tokenExp > currentTime
      );
      
      // Get expiration if token-shared
      let expiryInfo = null;
      if (isTokenShared) {
        const tokenShare = file.tokenSharedWith.find(share => share.recipient === user.email);
        if (tokenShare) {
          expiryInfo = {
            expiresAt: tokenShare.tokenExp,
            isTemporary: true
          };
        }
      }
      
      return {
        ...file._doc,
        accessType: isOwner ? 'owner' : 'shared',
        sharingMethod: isTokenShared ? 'temporary' : 'permanent',
        expiryInfo: expiryInfo
      };
    });
    
    res.status(200).json({ success: true, data: filesWithAccess });
  } catch (error) {
    console.log("Failed to fetch files", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    
    // Check if the current user is the owner OR if they're in the sharedWith array
    const isOwner = file.owner === req.user.email;
    const isShared = file.sharedWith.includes(req.user.email);
    
    if (!isOwner && !isShared) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not have permission to access this file' 
      });
    }
    
    // Add accessType to response
    const fileWithAccess = {
      ...file._doc,
      accessType: isOwner ? 'owner' : 'shared'
    };
    
    res.status(200).json({ success: true, data: fileWithAccess });
  } catch (error) {
    console.log("Failed to fetch a file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

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

export const shareFile = async (req, res) => {
  const { id } = req.params;
  const { emails } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide an array of email addresses' 
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter(email => !emailRegex.test(email));
  
  if (invalidEmails.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid email format: ${invalidEmails.join(', ')}` 
    });
  }

  try {
    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Only the owner can share the file
    if (file.owner !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Only the file owner can share this file' 
      });
    }

    // Add new emails, avoid duplicates
    const updatedSharedWith = [...new Set([...file.sharedWith, ...emails])];
    
    const updatedFile = await File.findByIdAndUpdate(
      id, 
      { sharedWith: updatedSharedWith }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'File shared successfully', 
      data: updatedFile 
    });

  } catch (error) {
    console.log("Failed to share file", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove sharing for specific users
export const removeSharing = async (req, res) => {
  const { id } = req.params;
  const { emails } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID' });
  }

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide an array of email addresses' 
    });
  }

  try {
    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Only the owner can modify sharing
    if (file.owner !== req.user.email) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Only the file owner can modify sharing' 
      });
    }

    // Remove the specified emails
    const updatedSharedWith = file.sharedWith.filter(email => !emails.includes(email));
    
    const updatedFile = await File.findByIdAndUpdate(
      id, 
      { sharedWith: updatedSharedWith }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Sharing permissions removed successfully', 
      data: updatedFile 
    });

  } catch (error) {
    console.log("Failed to remove sharing", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};