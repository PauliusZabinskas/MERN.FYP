import { generateShareToken, verifyShareToken, checkShareAccess } from "../util/secretToken.js";
import File from "../models/file.model.js";

/**
 * Generate a share token for a specific file
 * @route POST /api/share
 */
export const createShareToken = async (req, res) => {
  try {
    const { fileId, recipient, permissions = ["read", "download"], expiresIn } = req.body;
    
    if (!fileId || !recipient) {
      return res.status(400).json({
        success: false,
        message: "File ID and recipient email are required"
      });
    }
    
    // Check if file exists and user is the owner
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    
    // Verify ownership
    if (file.owner !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the owner of this file"
      });
    }
    
    // Generate the share token
    const shareInfo = {
      fileId,
      owner: req.user.email,
      recipient,
      permissions,
      expiresIn // Will use default if undefined
    };
    
    const token = generateShareToken(shareInfo);
    
    // Optionally update the file's sharedWith list if not already included
    if (!file.sharedWith.includes(recipient)) {
      file.sharedWith.push(recipient);
      await file.save();
    }
    
    res.status(200).json({
      success: true,
      shareToken: token
    });
    
  } catch (error) {
    console.error("Error generating share token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate share token"
    });
  }
};

/**
 * Verify a share token and return file access information
 * @route GET /api/share/verify
 */
export const verifyShare = async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Share token is required"
        });
      }
      
      const decoded = verifyShareToken(token);
      
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired share token"
        });
      }
      
      // Check if file exists
      const file = await File.findById(decoded.fileId);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "Shared file not found"
        });
      }
      
      // Check if the token was issued for the current user
      if (decoded.recipient !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: "This share token was not issued for your account"
        });
      }
      
      res.status(200).json({
        success: true,
        fileId: decoded.fileId,
        permissions: decoded.permissions,
        owner: decoded.owner,
        fileName: file.name,
        cid: file.cid  // Add the CID to the response
      });
      
    } catch (error) {
      console.error("Error verifying share token:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify share token"
      });
    }
  };

/**
 * Get all files shared with the current user
 * @route GET /api/share/received
 */
export const getSharedWithMe = async (req, res) => {
  try {
    // Find files where the current user's email is in sharedWith
    const files = await File.find({ sharedWith: req.user.email });
    
    res.status(200).json({
      success: true,
      data: files
    });
    
  } catch (error) {
    console.error("Error retrieving shared files:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve shared files"
    });
  }
};