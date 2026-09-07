import { Router } from "express";
import { approveInstructor, deleteAdminLesson, deleteCourse, getAdminCourseById, getAdminDashboard, getAllCourses, getAllUsers, getPendingInstructors, rejectInstructor } from "../controllers/adminController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  requireRole("ADMIN"),
  getAdminDashboard
);


router.get(
  "/users",
  authMiddleware,
  requireRole("ADMIN"),
  getAllUsers
);
router.get(
  "/courses",
  authMiddleware,
  requireRole("ADMIN"),
  getAllCourses
);

router.delete(
  "/courses/:courseId",
  authMiddleware,
  requireRole("ADMIN"),
  deleteCourse
);
router.get(
  "/courses/:courseId",
  authMiddleware,
  requireRole("ADMIN"),
  getAdminCourseById
);

router.delete(
  "/lessons/:lessonId",
  authMiddleware,
  requireRole("ADMIN"),
  deleteAdminLesson
);

router.patch(
  "/instructors/:userId/approve",
  authMiddleware,
  requireRole("ADMIN"),
  approveInstructor
);

router.patch(
  "/instructors/:userId/reject",
  authMiddleware,
  requireRole("ADMIN"),
  rejectInstructor
);

router.get(
  "/instructors/pending",
  authMiddleware,
  requireRole("ADMIN"),
  getPendingInstructors
);
export default router;
