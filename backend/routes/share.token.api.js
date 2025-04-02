import express from "express";
import { createShareToken, verifyShare, getSharedWithMe } from "../controllers/shareToken.controller.js";
import { userVerification } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(userVerification);

// Generate a share token for a file
router.post("/", createShareToken);

// Verify a share token
router.get("/verify", verifyShare);

// Get all files shared with the current user
router.get("/received", getSharedWithMe);

export default router;