import { Router } from "express";
import { getCourses,getCourseById, getCourseLessons } from "../controllers/courseController";
import { authMiddleware } from "../middleware/authMiddleware";
const router = Router();
router.get('/', getCourses)
router.get("/:id", getCourseById);
router.get(
  "/:id/lessons",
  authMiddleware,
  getCourseLessons
);
export default router;
