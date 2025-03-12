import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

// Default secret key in case environment variable is not set
const DEFAULT_SECRET = "fallback_secret_key_do_not_use_in_production";

export const createSecretToken = (id) => {
  const secretKey = process.env.TOKEN_KEY || DEFAULT_SECRET;
  
  if (!secretKey) {
    throw new Error("TOKEN_KEY not defined in environment variables");
  }
  
  console.log("Creating token with secret key length:", secretKey.length);
  
  return jwt.sign({ id }, secretKey, {
    expiresIn: 3 * 24 * 60 * 60,
  });
};