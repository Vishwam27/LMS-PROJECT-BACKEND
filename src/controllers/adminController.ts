import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getAdminDashboard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // The route is protected by requireRole("ADMIN"),
    // but keep this check as an extra safeguard.
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalEnrollments,
    ] = await Promise.all([
      // Users
      prisma.user.count(),

      // Students
      prisma.user.count({
        where: {
          role: "STUDENT",
        },
      }),

      // Instructors
      prisma.user.count({
        where: {
          role: "INSTRUCTOR",
        },
      }),

      // Admins
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),

      // Courses
      prisma.course.count(),

      // Published courses
      prisma.course.count({
        where: {
          isPublished: true,
        },
      }),

      // Enrollments
      prisma.enrollment.count(),
    ]);

    res.status(200).json({
      message: "Admin dashboard loaded successfully",

      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        publishedCourses,
        totalEnrollments,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    res.status(500).json({
      message: "Unable to load admin dashboard",
    });
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error(
      "Get all users error:",
      error
    );

    res.status(500).json({
      message: "Unable to load users",
    });
  }
};

export const getAllCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error("Get all admin courses error:", error);

    res.status(500).json({
      message: "Unable to load courses",
    });
  }
};

export const deleteCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId;

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    // Check that the course exists
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found",
      });
      return;
    }

    // Delete course
    // Related Lesson / Enrollment records should be
    // removed through the Prisma cascade relations.
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    res.status(200).json({
      message: "Course deleted successfully",
      deletedCourse: {
        id: course.id,
        title: course.title,
      },
    });
  } catch (error) {
    console.error("Delete course error:", error);

    res.status(500).json({
      message: "Unable to delete course",
    });
  }
};

export const getAdminCourseById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId;

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        level: true,
        duration: true,
        instructorId: true,
        categoryId: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        lessons: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: "asc",
          },
        },

        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found",
      });
      return;
    }

    res.status(200).json({
      course,
    });
  } catch (error) {
    console.error(
      "Get admin course error:",
      error
    );

    res.status(500).json({
      message: "Unable to load course",
    });
  }
};



export const deleteAdminLesson = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const lessonId = Array.isArray(req.params.lessonId)
      ? req.params.lessonId[0]
      : req.params.lessonId;

    if (!lessonId) {
      res.status(400).json({
        message: "Lesson ID is required",
      });
      return;
    }

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      select: {
        id: true,
        title: true,
        courseId: true,
      },
    });

    if (!lesson) {
      res.status(404).json({
        message: "Lesson not found",
      });
      return;
    }

    await prisma.lesson.delete({
      where: {
        id: lessonId,
      },
    });

    res.status(200).json({
      message: "Lesson deleted successfully",
      deletedLesson: {
        id: lesson.id,
        title: lesson.title,
        courseId: lesson.courseId,
      },
    });
  } catch (error) {
    console.error(
      "Delete admin lesson error:",
      error
    );

    res.status(500).json({
      message: "Unable to delete lesson",
    });
  }
};


export const approveInstructor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    // Only instructors can be approved
    if (user.role !== "INSTRUCTOR") {
      res.status(400).json({
        message: "Only instructor accounts can be approved",
      });
      return;
    }

    // Already approved
    if (user.status === "APPROVED") {
      res.status(409).json({
        message: "Instructor is already approved",
      });
      return;
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          status: "APPROVED",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

    res.status(200).json({
      message: "Instructor approved successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Approve instructor error:",
      error
    );

    res.status(500).json({
      message: "Unable to approve instructor",
    });
  }
};


export const rejectInstructor = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.role !== "INSTRUCTOR") {
      res.status(400).json({
        message: "Only instructor accounts can be rejected",
      });
      return;
    }

    if (user.status === "REJECTED") {
      res.status(409).json({
        message: "Instructor is already rejected",
      });
      return;
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          status: "REJECTED",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

    res.status(200).json({
      message: "Instructor rejected successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Reject instructor error:",
      error
    );

    res.status(500).json({
      message: "Unable to reject instructor",
    });
  }
};

export const getPendingInstructors = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: "INSTRUCTOR",
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.status(200).json({
      instructors,
      total: instructors.length,
    });
  } catch (error) {
    console.error(
      "Get pending instructors error:",
      error
    );

    res.status(500).json({
      message: "Unable to load pending instructors",
    });
  }
};