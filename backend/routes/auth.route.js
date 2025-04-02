import { Signup, Login, Logout, Verify } from "../controllers/auth.controller.js";
import express from "express";

const router = express.Router();

// Auth routes
router.post("/register", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.get("/verify", Verify);

export default router;