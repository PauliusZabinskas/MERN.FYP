import { tokenUtils } from "../util/tokenUtilWrapper.js";
import File from "../models/file.model.js";

/**
 * Generate a share token for a specific file
 * @route POST /api/share
 */
export const createShareToken = async (req, res) => {
  try {
    // First check: require authenticated user
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const { fileId, recipient, permissions = ["read", "download"], expiresIn } = req.body;
    
    // Validate required fields (the tests for missing data set req.user)
    if (!fileId || !recipient) {
      return res.status(400).json({
        success: false,
        message: "File ID and recipient email are required"
      });
    }
    
    // Check if file exists and that the requester is the owner
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    if (file.owner !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the owner of this file"
      });
    }
    
    // Generate token via the wrapper
    const shareInfo = { fileId, owner: req.user.email, recipient, permissions, expiresIn };
    const token = tokenUtils.generateShareToken(shareInfo);
    
    const expirationSeconds = expiresIn || 7 * 24 * 60 * 60;
    const expirationTime = Math.floor(Date.now() / 1000) + expirationSeconds;
    
    // Update token info on file (remove any previous share for recipient)
    file.tokenSharedWith = file.tokenSharedWith.filter(share => share.recipient !== recipient);
    file.tokenSharedWith.push({
      recipient: recipient,
      tokenExp: expirationTime
    });
    
    await file.save();
    
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
    // Require authentication
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Share token is required"
      });
    }
    
    const decoded = tokenUtils.verifyShareToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired share token"
      });
    }
    
    const file = await File.findById(decoded.fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Shared file not found"
      });
    }
    
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
      cid: file.cid,
      expiresAt: decoded.exp
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
    // Require authentication
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const files = await File.find({ sharedWith: req.user.email });
    res.status(200).json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error("Error retrieving shared files:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve shared files"
    });
  }
};