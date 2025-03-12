import { Signup, Login } from "../controllers/auth.controller.js";
import express from "express";

const router = express.Router();

// Auth routes
router.post("/register", Signup);
router.post("/login", Login);

// Test route to verify API is working
router.get("/test", (req, res) => {
  res.json({ message: "Auth API is working" });
});

export default router;