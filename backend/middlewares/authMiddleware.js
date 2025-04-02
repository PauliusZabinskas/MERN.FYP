import User from "../models/userModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const userVerification = (req, res, next) => {
  try {
    // Check cookie first
    const cookieToken = req.cookies.token;

    // Then check Authorization header
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;
    
    // Use whichever token is available
    const token = cookieToken || headerToken;
    
    if (!token) {
      return res.status(401).json({ 
        status: false, 
        message: "Authentication required" 
      });
    }
    
    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
      if (err) {
        console.error("Token verification error:", err);
        return res.status(401).json({ 
          status: false, 
          message: "Invalid or expired token" 
        });
      } 
      
      try {
        const user = await User.findById(data.id);
        if (user) {
          // Attach user to request for ownership checks in controllers
          req.user = user;
          next();
        } else {
          return res.status(401).json({ 
            status: false, 
            message: "User not found" 
          });
        }
      } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
          status: false, 
          message: "Database error" 
        });
      }
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      status: false, 
      message: "Server error" 
    });
  }
};

/**
 * Middleware to validate share tokens
 * This middleware validates a share token and attaches the token data to the request
 * It doesn't enforce authentication - it simply validates the token if present
 */
export const validateShareToken = async (req, res, next) => {
  try {
    // Get token from query parameter or header
    const token = req.query.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                   ? req.headers.authorization.split(' ')[1] 
                   : null);
    
    // If no token, just continue without attaching share data
    if (!token) {
      return next();
    }
    
    // Verify the token
    const decoded = verifyShareToken(token);
    
    if (!decoded) {
      // Token invalid but we don't block the request
      // Just continue without share data
      return next();
    }
    
    // Check if the file exists
    const file = await File.findById(decoded.fileId);
    
    if (!file) {
      return next();
    }
    
    // Attach the share data to the request for use in controllers
    req.shareData = {
      isValid: true,
      fileId: decoded.fileId,
      owner: decoded.owner,
      recipient: decoded.recipient,
      permissions: decoded.permissions || []
    };
    
    next();
  } catch (error) {
    console.error("Share token validation error:", error);
    // Don't block the request on error, just continue
    next();
  }
};

/**
 * Middleware to ensure either user authentication OR valid share token with specified permission
 * @param {String} permission - The permission required ('read', 'download', etc.)
 */
export const requireAuthOrValidShare = (permission) => {
  return async (req, res, next) => {
    try {
      // First check for user authentication
      const cookieToken = req.cookies.token;
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : null;
      
      const userToken = cookieToken || headerToken;
      
      // If user is authenticated, proceed
      if (userToken) {
        try {
          const decoded = jwt.verify(userToken, process.env.TOKEN_KEY);
          const user = await User.findById(decoded.id);
          
          if (user) {
            req.user = user;
            return next();
          }
        } catch (error) {
          // Token validation failed, continue to check share token
          console.log("User token validation failed, checking share token");
        }
      }
      
      // Then check for valid share token with required permission
      // This should have been attached by validateShareToken middleware
      if (req.shareData && req.shareData.isValid && 
          req.shareData.permissions.includes(permission)) {
        return next();
      }
      
      // If neither authentication nor valid share token, return 401
      return res.status(401).json({
        status: false,
        message: "Authentication required or valid share token with sufficient permissions"
      });
      
    } catch (error) {
      console.error("Auth/share middleware error:", error);
      return res.status(500).json({
        status: false,
        message: "Server error"
      });
    }
  };
};

