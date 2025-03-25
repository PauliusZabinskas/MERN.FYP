import User from "../models/userModel.js";
import { createSecretToken } from "../util/secretToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Add this import for the Verify function

export const Signup = async (req, res, next) => {
  try {
      console.log("Registration request:", req.body);
      const { email, password, username, createdAt } = req.body;
      
      if (email.length > 320) { // Standard maximum email length
        return res.status(400).json({
          success: false,
          message: "Email exceeds maximum allowed length"
        });
      }
      
      // Then use the improved regex
      const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,255}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
      
      // Use a simple string for the query to prevent NoSQL injection
      const existingUser = await User.findOne({ email: String(email).trim() });
      
      // Check if user already exists
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
      
      const user = await User.create({ email, password, username, createdAt });
      const token = createSecretToken(user._id);
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      });
      
      res.status(201).json({ 
        success: true, 
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Internal server error" 
      });
    }
  };

  
  export const Login = async (req, res) => {
    try {
      console.log("Login request:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }
      
      // Validate email format before querying
      const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,255}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
      
      // Use a simple string for the query to prevent NoSQL injection
      const user = await User.findOne({ email: String(email).trim() });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
      
      const token = createSecretToken(user._id);
      console.log("Generated token for user:", user.email);
      
      // Set cookie
      res.cookie("token", token, {
        httpOnly: true, // Set to true for security
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
      });
      
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  export const Logout = async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }
  };

  export const Verify = async (req, res) => {
    try {
      const token = req.cookies.token;
      
      if (!token) {
        return res.json({ authenticated: false });
      }
      
      // Verify the token
      jwt.verify(token, process.env.TOKEN_KEY, async (err, decoded) => {
        if (err) {
          console.log("Token verification failed:", err.message);
          return res.json({ authenticated: false });
        }
        
        try {
          const user = await User.findById(decoded.id);
          if (!user) {
            console.log("User not found for token");
            return res.json({ authenticated: false });
          }
          
          console.log("User authenticated:", user.email);
          return res.json({ 
            authenticated: true,
            user: {
              id: user._id,
              email: user.email,
              username: user.username
            }
          });
        } catch (error) {
          console.error("Database error during verification:", error);
          return res.json({ authenticated: false });
        }
      });
    } catch (error) {
      console.error("Verification error:", error);
      return res.json({ authenticated: false });
    }
  };