import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getDashboard
);

export default router;