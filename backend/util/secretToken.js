import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Create a secret token for authentication
export const createSecretToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: "3d",
  });
};

// Default expiration time for share tokens (1 week in seconds)
const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60;

/**
 * Generate a token for file sharing
 * @param {Object} shareInfo Information about the share (fileId, owner, recipient, permissions, expiresIn)
 * @returns {String} Generated JWT token
 */
export const generateShareToken = (shareInfo) => {
  const secretKey = process.env.TOKEN_KEY || "fallback_secret_key_do_not_use_in_production";
  const expiresIn = shareInfo.expiresIn || DEFAULT_EXPIRATION;
  
  return jwt.sign({
    fileId: shareInfo.fileId,
    owner: shareInfo.owner,
    recipient: shareInfo.recipient,
    permissions: shareInfo.permissions,
    type: "file-share"
  }, secretKey, {
    expiresIn
  });
};

/**
 * Verify a share token
 * @param {String} token The JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyShareToken = (token) => {
  try {
    const secretKey = process.env.TOKEN_KEY || "fallback_secret_key_do_not_use_in_production";
    return jwt.verify(token, secretKey);
  } catch (error) {
    console.error("Error verifying share token:", error);
    return null;
  }
};

/**
 * Check if a user has access to a file based on a token
 * @param {String} token The JWT token
 * @param {String} fileId The file ID to check access for
 * @param {String} userEmail The email of the user attempting access
 * @param {String} requiredPermission The permission being checked ("read" or "download")
 * @returns {Boolean} Whether access is granted
 */
export const checkShareAccess = (token, fileId, userEmail, requiredPermission) => {
  try {
    const decoded = verifyShareToken(token);
    
    if (!decoded) return false;
    
    // Check if token is for the correct file
    if (decoded.fileId !== fileId) return false;
    
    // Check if token was issued for this user
    if (decoded.recipient !== userEmail) return false;
    
    // Check if user has the required permission
    return decoded.permissions.includes(requiredPermission);
  } catch (error) {
    console.error("Error checking share access:", error);
    return false;
  }
};