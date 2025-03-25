import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createSecretToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: "3d",
  });
};

const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60;

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

export const verifyShareToken = (token) => {
  try {
    const secretKey = process.env.TOKEN_KEY || "fallback_secret_key_do_not_use_in_production";
    return jwt.verify(token, secretKey);
  } catch (error) {
    console.error("Error verifying share token:", error);
    return null;
  }
};

export const checkShareAccess = (token, fileId, userEmail, requiredPermission) => {
  try {
    const decoded = verifyShareToken(token);
    if (!decoded) return false;
    if (decoded.fileId !== fileId) return false;
    if (decoded.recipient !== userEmail) return false;
    return decoded.permissions.includes(requiredPermission);
  } catch (error) {
    console.error("Error checking share access:", error);
    return false;
  }
};