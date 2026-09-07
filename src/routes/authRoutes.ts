import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile
} from "../controllers/authController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", authMiddleware, getMe);

router.put("/profile", authMiddleware, updateProfile);

export default router;