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
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
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