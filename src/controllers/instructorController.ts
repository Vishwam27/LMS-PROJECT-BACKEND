import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// =========================================================
// HELPER: VERIFY APPROVED INSTRUCTOR
// =========================================================

const getApprovedInstructor = async (
  instructorId: string
) => {
  const instructor = await prisma.user.findUnique({
    where: {
      id: instructorId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
    },
  });

  if (!instructor) {
    return {
      error: "NOT_FOUND" as const,
      instructor: null,
    };
  }

  if (instructor.role !== "INSTRUCTOR") {
    return {
      error: "FORBIDDEN_ROLE" as const,
      instructor: null,
    };
  }

  if (instructor.status !== "APPROVED") {
    return {
      error: "FORBIDDEN_STATUS" as const,
      instructor,
    };
  }

  return {
    error: null,
    instructor,
  };
};

// =========================================================
// HELPER: PARAMETER VALUE
// =========================================================

const getParam = (
  value: string | string[] | undefined
): string | null => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

// =========================================================
// INSTRUCTOR DASHBOARD
// =========================================================

export const getInstructorDashboard = async (
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

    const instructorId = req.user.userId;

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (result.error === "FORBIDDEN_ROLE") {
      res.status(403).json({
        message: "Instructor access required",
      });
      return;
    }

    if (result.error === "FORBIDDEN_STATUS") {
      res.status(403).json({
        message:
          "Your instructor account is not approved.",
        status: result.instructor?.status,
      });
      return;
    }

    const instructor = result.instructor;

    const courses = await prisma.course.findMany({
      where: {
        instructorId,
      },

      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        level: true,
        duration: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
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
        updatedAt: "desc",
      },
    });

    const totalCourses = courses.length;

    const publishedCourses = courses.filter(
      (course) => course.isPublished
    ).length;

    const totalLessons = courses.reduce(
      (total, course) =>
        total + course._count.lessons,
      0
    );

    const totalStudents = courses.reduce(
      (total, course) =>
        total + course._count.enrollments,
      0
    );

    res.status(200).json({
      instructor: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        status: instructor.status,
        avatarUrl: instructor.avatarUrl,
      },

      stats: {
        totalCourses,
        publishedCourses,
        totalStudents,
        totalLessons,
      },

      courses,
    });
  } catch (error) {
    console.error(
      "Instructor dashboard error:",
      error
    );

    res.status(500).json({
      message: "Unable to load instructor dashboard",
    });
  }
};

// =========================================================
// GET INSTRUCTOR COURSES
// =========================================================

export const getInstructorCourses = async (
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

    const instructorId = req.user.userId;

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (result.error === "FORBIDDEN_ROLE") {
      res.status(403).json({
        message: "Instructor access required",
      });
      return;
    }

    if (result.error === "FORBIDDEN_STATUS") {
      res.status(403).json({
        message:
          "Your instructor account is not approved.",
      });
      return;
    }

    const courses = await prisma.course.findMany({
      where: {
        instructorId,
      },

      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        level: true,
        duration: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
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
        updatedAt: "desc",
      },
    });

    res.status(200).json({
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error(
      "Get instructor courses error:",
      error
    );

    res.status(500).json({
      message: "Unable to load instructor courses",
    });
  }
};

// =========================================================
// GET INSTRUCTOR COURSE BY ID
// =========================================================

export const getInstructorCourseById = async (
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

    const instructorId = req.user.userId;

    const courseId = getParam(
      req.params.courseId
    );

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (result.error === "FORBIDDEN_ROLE") {
      res.status(403).json({
        message: "Instructor access required",
      });
      return;
    }

    if (result.error === "FORBIDDEN_STATUS") {
      res.status(403).json({
        message:
          "Your instructor account is not approved.",
      });
      return;
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId,
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
        message:
          "Course not found or you do not have access to this course",
      });
      return;
    }

    res.status(200).json({
      course,
    });
  } catch (error) {
    console.error(
      "Get instructor course error:",
      error
    );

    res.status(500).json({
      message: "Unable to load course",
    });
  }
};

// =========================================================
// UPDATE INSTRUCTOR COURSE
// =========================================================

export const updateInstructorCourse = async (
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

    const instructorId = req.user.userId;

    const courseId = getParam(
      req.params.courseId
    );

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    const {
      title,
      description,
      imageUrl,
      price,
      level,
      duration,
      categoryId,
    } = req.body;

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (
      result.error === "FORBIDDEN_ROLE" ||
      result.error === "FORBIDDEN_STATUS"
    ) {
      res.status(403).json({
        message: "Approved instructor access required",
      });
      return;
    }

    const existingCourse =
      await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId,
        },
      });

    if (!existingCourse) {
      res.status(404).json({
        message:
          "Course not found or you do not have access to this course",
      });
      return;
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      price === undefined ||
      !level ||
      !duration ||
      !categoryId
    ) {
      res.status(400).json({
        message:
          "Title, description, price, level, duration and category are required",
      });
      return;
    }

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      res.status(400).json({
        message:
          "Price must be a valid non-negative number",
      });
      return;
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    const updatedCourse =
      await prisma.course.update({
        where: {
          id: courseId,
        },

        data: {
          title: title.trim(),
          description: description.trim(),
          imageUrl:
            typeof imageUrl === "string"
              ? imageUrl.trim() || null
              : null,
          price: numericPrice,
          level: String(level).trim(),
          duration: String(duration).trim(),
          categoryId,
        },

        include: {
          category: {
            select: {
              id: true,
              name: true,
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

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error(
      "Update instructor course error:",
      error
    );

    res.status(500).json({
      message: "Unable to update course",
    });
  }
};

// =========================================================
// DELETE INSTRUCTOR COURSE
// =========================================================

export const deleteInstructorCourse = async (
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

    const instructorId = req.user.userId;

    const courseId = getParam(
      req.params.courseId
    );

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (
      result.error === "FORBIDDEN_ROLE" ||
      result.error === "FORBIDDEN_STATUS"
    ) {
      res.status(403).json({
        message: "Approved instructor access required",
      });
      return;
    }

    const course =
      await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (!course) {
      res.status(404).json({
        message:
          "Course not found or you do not have access to this course",
      });
      return;
    }

    await prisma.course.delete({
      where: {
        id: course.id,
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
    console.error(
      "Delete instructor course error:",
      error
    );

    res.status(500).json({
      message: "Unable to delete course",
    });
  }
};

// =========================================================
// TOGGLE COURSE PUBLISH STATUS
// =========================================================

export const toggleInstructorCoursePublish =
  async (
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

      const instructorId = req.user.userId;

      const courseId = getParam(
        req.params.courseId
      );

      if (!courseId) {
        res.status(400).json({
          message: "Course ID is required",
        });
        return;
      }

      const result = await getApprovedInstructor(
        instructorId
      );

      if (result.error === "NOT_FOUND") {
        res.status(404).json({
          message: "Instructor account not found",
        });
        return;
      }

      if (
        result.error === "FORBIDDEN_ROLE" ||
        result.error === "FORBIDDEN_STATUS"
      ) {
        res.status(403).json({
          message:
            "Approved instructor access required",
        });
        return;
      }

      const course =
        await prisma.course.findFirst({
          where: {
            id: courseId,
            instructorId,
          },

          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        });

      if (!course) {
        res.status(404).json({
          message:
            "Course not found or you do not have access to this course",
        });
        return;
      }

      const updatedCourse =
        await prisma.course.update({
          where: {
            id: course.id,
          },

          data: {
            isPublished: !course.isPublished,
          },

          select: {
            id: true,
            title: true,
            isPublished: true,
          },
        });

      res.status(200).json({
        message: updatedCourse.isPublished
          ? "Course published successfully"
          : "Course unpublished successfully",

        course: updatedCourse,
      });
    } catch (error) {
      console.error(
        "Toggle instructor course publish error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to update course publish status",
      });
    }
  };

// =========================================================
// CREATE INSTRUCTOR LESSON
// =========================================================

export const createInstructorLesson = async (
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

    const instructorId = req.user.userId;

    const courseId = getParam(
      req.params.courseId
    );

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    const {
      title,
      description,
      videoUrl,
      duration,
    } = req.body;

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (
      result.error === "FORBIDDEN_ROLE" ||
      result.error === "FORBIDDEN_STATUS"
    ) {
      res.status(403).json({
        message: "Approved instructor access required",
      });
      return;
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId,
      },

      select: {
        id: true,
        title: true,
      },
    });

    if (!course) {
      res.status(404).json({
        message:
          "Course not found or you do not have access to this course",
      });
      return;
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      res.status(400).json({
        message: "Lesson title is required",
      });
      return;
    }

    if (
      typeof videoUrl !== "string" ||
      !videoUrl.trim()
    ) {
      res.status(400).json({
        message: "Video URL is required",
      });
      return;
    }

    let lessonDuration: number | null = null;

    if (
      duration !== undefined &&
      duration !== null &&
      duration !== ""
    ) {
      lessonDuration = Number(duration);

      if (
        Number.isNaN(lessonDuration) ||
        lessonDuration < 0
      ) {
        res.status(400).json({
          message:
            "Duration must be a valid non-negative number",
        });
        return;
      }
    }

    const lastLesson =
      await prisma.lesson.findFirst({
        where: {
          courseId: course.id,
        },

        orderBy: {
          order: "desc",
        },

        select: {
          order: true,
        },
      });

    const nextOrder = lastLesson
      ? lastLesson.order + 1
      : 1;

    const lesson = await prisma.lesson.create({
      data: {
        courseId: course.id,
        title: title.trim(),
        description:
          typeof description === "string" &&
          description.trim()
            ? description.trim()
            : null,
        videoUrl: videoUrl.trim(),
        duration: lessonDuration,
        order: nextOrder,
        isPublished: true,
      },

      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson,
    });
  } catch (error) {
    console.error(
      "Create instructor lesson error:",
      error
    );

    res.status(500).json({
      message: "Unable to create lesson",
    });
  }
};

// =========================================================
// GET INSTRUCTOR LESSON BY ID
// =========================================================

export const getInstructorLessonById = async (
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

    const instructorId = req.user.userId;

    const lessonId = getParam(
      req.params.lessonId
    );

    if (!lessonId) {
      res.status(400).json({
        message: "Lesson ID is required",
      });
      return;
    }

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (result.error === "FORBIDDEN_ROLE") {
      res.status(403).json({
        message: "Instructor access required",
      });
      return;
    }

    if (result.error === "FORBIDDEN_STATUS") {
      res.status(403).json({
        message:
          "Your instructor account is not approved",
      });
      return;
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          instructorId,
        },
      },

      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,

        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      res.status(404).json({
        message:
          "Lesson not found or you do not have access to this lesson",
      });
      return;
    }

    res.status(200).json({
      lesson,
    });
  } catch (error) {
    console.error(
      "Get instructor lesson error:",
      error
    );

    res.status(500).json({
      message: "Unable to load lesson",
    });
  }
};

// =========================================================
// UPDATE INSTRUCTOR LESSON
// =========================================================

export const updateInstructorLesson = async (
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

    const instructorId = req.user.userId;

    const lessonId = getParam(
      req.params.lessonId
    );

    if (!lessonId) {
      res.status(400).json({
        message: "Lesson ID is required",
      });
      return;
    }

    const {
      title,
      description,
      videoUrl,
      duration,
    } = req.body;

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (
      result.error === "FORBIDDEN_ROLE" ||
      result.error === "FORBIDDEN_STATUS"
    ) {
      res.status(403).json({
        message: "Approved instructor access required",
      });
      return;
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      res.status(400).json({
        message: "Lesson title is required",
      });
      return;
    }

    if (
      typeof videoUrl !== "string" ||
      !videoUrl.trim()
    ) {
      res.status(400).json({
        message: "Video URL is required",
      });
      return;
    }

    let lessonDuration: number | null = null;

    if (
      duration !== undefined &&
      duration !== null &&
      duration !== ""
    ) {
      lessonDuration = Number(duration);

      if (
        Number.isNaN(lessonDuration) ||
        lessonDuration < 0
      ) {
        res.status(400).json({
          message:
            "Duration must be a valid non-negative number",
        });
        return;
      }
    }

    // -------------------------------------------------------
    // Find lesson
    // -------------------------------------------------------

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },

      select: {
        id: true,
        courseId: true,
      },
    });

    if (!lesson) {
      res.status(404).json({
        message: "Lesson not found",
      });
      return;
    }

    // -------------------------------------------------------
    // Verify ownership
    // -------------------------------------------------------

    const course = await prisma.course.findUnique({
      where: {
        id: lesson.courseId,
      },

      select: {
        id: true,
        instructorId: true,
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course for this lesson was not found",
      });
      return;
    }

    if (course.instructorId !== instructorId) {
      res.status(403).json({
        message:
          "You do not have permission to edit this lesson",
      });
      return;
    }

    // -------------------------------------------------------
    // Update
    // -------------------------------------------------------

    const updatedLesson =
      await prisma.lesson.update({
        where: {
          id: lessonId,
        },

        data: {
          title: title.trim(),
          description:
            typeof description === "string" &&
            description.trim()
              ? description.trim()
              : null,
          videoUrl: videoUrl.trim(),
          duration: lessonDuration,
        },

        select: {
          id: true,
          courseId: true,
          title: true,
          description: true,
          videoUrl: true,
          duration: true,
          order: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    res.status(200).json({
      message: "Lesson updated successfully",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error(
      "Update instructor lesson error:",
      error
    );

    res.status(500).json({
      message: "Unable to update lesson",
    });
  }
};

// =========================================================
// DELETE INSTRUCTOR LESSON
// =========================================================

export const deleteInstructorLesson = async (
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

    const instructorId = req.user.userId;

    const lessonId = getParam(
      req.params.lessonId
    );

    if (!lessonId) {
      res.status(400).json({
        message: "Lesson ID is required",
      });
      return;
    }

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (
      result.error === "FORBIDDEN_ROLE" ||
      result.error === "FORBIDDEN_STATUS"
    ) {
      res.status(403).json({
        message: "Approved instructor access required",
      });
      return;
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          instructorId,
        },
      },

      select: {
        id: true,
        title: true,
        courseId: true,
      },
    });

    if (!lesson) {
      res.status(404).json({
        message:
          "Lesson not found or you do not have access to this lesson",
      });
      return;
    }

    await prisma.lesson.delete({
      where: {
        id: lesson.id,
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
      "Delete instructor lesson error:",
      error
    );

    res.status(500).json({
      message: "Unable to delete lesson",
    });
  }
};

// =========================================================
// CREATE INSTRUCTOR COURSE
// =========================================================

export const createInstructorCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // -------------------------------------------------------
    // Authentication
    // -------------------------------------------------------

    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const instructorId = req.user.userId;

    // -------------------------------------------------------
    // Verify approved instructor
    // -------------------------------------------------------

    const result = await getApprovedInstructor(
      instructorId
    );

    if (result.error === "NOT_FOUND") {
      res.status(404).json({
        message: "Instructor account not found",
      });
      return;
    }

    if (result.error === "FORBIDDEN_ROLE") {
      res.status(403).json({
        message: "Instructor access required",
      });
      return;
    }

    if (result.error === "FORBIDDEN_STATUS") {
      res.status(403).json({
        message:
          "Your instructor account is not approved",
      });
      return;
    }

    // -------------------------------------------------------
    // Request body
    // -------------------------------------------------------

    const {
      title,
      description,
      imageUrl,
      price,
      level,
      duration,
      categoryId,
    } = req.body;

    // -------------------------------------------------------
    // Validate required fields
    // -------------------------------------------------------

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      res.status(400).json({
        message: "Course title is required",
      });
      return;
    }

    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      res.status(400).json({
        message: "Course description is required",
      });
      return;
    }

    if (price === undefined || price === null) {
      res.status(400).json({
        message: "Course price is required",
      });
      return;
    }

    if (
      typeof level !== "string" ||
      !level.trim()
    ) {
      res.status(400).json({
        message: "Course level is required",
      });
      return;
    }

    if (
      typeof duration !== "string" ||
      !duration.trim()
    ) {
      res.status(400).json({
        message: "Course duration is required",
      });
      return;
    }

    if (
      typeof categoryId !== "string" ||
      !categoryId
    ) {
      res.status(400).json({
        message: "Category is required",
      });
      return;
    }

    // -------------------------------------------------------
    // Validate price
    // -------------------------------------------------------

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      res.status(400).json({
        message:
          "Price must be a valid non-negative number",
      });
      return;
    }

    // -------------------------------------------------------
    // Verify category
    // -------------------------------------------------------

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!category) {
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }

    // -------------------------------------------------------
    // Create course
    // -------------------------------------------------------

    const course = await prisma.course.create({
      data: {
        title: title.trim(),

        description: description.trim(),

        imageUrl:
          typeof imageUrl === "string"
            ? imageUrl.trim() || null
            : null,

        price: numericPrice,

        level: level.trim(),

        duration: duration.trim(),

        instructorId,

        categoryId,

        // New instructor courses are immediately published
        isPublished: true,
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

        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    // -------------------------------------------------------
    // Success
    // -------------------------------------------------------

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error(
      "Create instructor course error:",
      error
    );

    res.status(500).json({
      message: "Unable to create course",
    });
  }
};