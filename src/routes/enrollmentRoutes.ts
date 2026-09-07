import { Router } from "express";

import {
  getMyCourses,
  enrollInCourse,
  updateLessonProgress,
  getCourseProgress,
} from "../controllers/entrollmentController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/my-courses",
  authMiddleware,
  getMyCourses
);

router.post(
  "/:courseId",
  authMiddleware,
  enrollInCourse
);
router.put(
  "/lessons/:lessonId/progress",
  authMiddleware,
  updateLessonProgress
);
router.get(
  "/courses/:courseId/progress",
  authMiddleware,
  getCourseProgress
);
export default router;