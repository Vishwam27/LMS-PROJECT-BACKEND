import { Router } from "express";

import {
  getInstructorDashboard,
  getInstructorCourses,
  getInstructorCourseById,
  updateInstructorCourse,
  deleteInstructorCourse,
  toggleInstructorCoursePublish,
  createInstructorLesson,
  deleteInstructorLesson,
  getInstructorLessonById,
  createInstructorCourse,
} from "../controllers/instructorController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  getInstructorDashboard
);

router.get(
  "/courses",
  authMiddleware,
  getInstructorCourses
);

router.get(
  "/courses/:courseId",
  authMiddleware,
  getInstructorCourseById
);

router.put(
  "/courses/:courseId",
  authMiddleware,
  updateInstructorCourse
);

router.delete(
  "/courses/:courseId",
  authMiddleware,
  deleteInstructorCourse
);

router.patch(
  "/courses/:courseId/publish",
  authMiddleware,
  toggleInstructorCoursePublish
);
router.post(
  "/courses/:courseId/lessons",
  authMiddleware,
  createInstructorLesson
);


router.delete(
  "/lessons/:lessonId",
  authMiddleware,
  deleteInstructorLesson
);

router.get(
  "/lessons/:lessonId",
  authMiddleware,
  getInstructorLessonById
);
router.post(
  "/courses",
  authMiddleware,
  createInstructorCourse
);
export default router;