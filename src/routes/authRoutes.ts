import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  googleLogin,
  deleteAccount
} from "../controllers/authController";

import { authMiddleware } from "../middleware/authMiddleware";
import {
  loginRateLimiter,
  registerRateLimiter,
  googleRateLimiter,
} from "../middleware/rateLimit";

const router = Router();

router.post("/register",registerRateLimiter,register);

router.post("/login",loginRateLimiter,login);

router.post("/google",googleRateLimiter,googleLogin);

router.get("/me", authMiddleware, getMe);

router.put("/profile", authMiddleware, updateProfile);
router.delete("/account",authMiddleware,deleteAccount);

export default router;