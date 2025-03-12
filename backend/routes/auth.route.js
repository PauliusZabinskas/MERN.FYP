import { Signup, Login } from "../controllers/auth.controller.js";
import express from "express";

const router = express.Router();

// Auth routes
router.post("/register", Signup);
router.post("/login", Login);

export default router;