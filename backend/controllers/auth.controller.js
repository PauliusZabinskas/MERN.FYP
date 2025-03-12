import User from "../models/userModel.js";
import { createSecretToken } from "../util/secretToken.js";
import bcrypt from "bcryptjs";

export const Signup = async (req, res, next) => {
    try {
      console.log("Registration request:", req.body);
      const { email, password, username, createdAt } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "User already exists" 
        });
      }
      
      const user = await User.create({ email, password, username, createdAt });
      const token = createSecretToken(user._id);
      
      res.cookie("token", token, {
        httpOnly: false,
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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }
    
    const user = await User.findOne({ email });
    
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
    
    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};