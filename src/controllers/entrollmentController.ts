import { Request, Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getMyCourses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            category: true,
            lessons: {
              where: {
                isPublished: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessons = enrollment.course.lessons;

        const progressRecords =
          await prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: {
                in: lessons.map((lesson) => lesson.id),
              },
            },
          });

        const completedLessons =
          progressRecords.filter(
            (progress) => progress.completed
          ).length;

        const totalLessons = lessons.length;

        const progress =
          totalLessons > 0
            ? Math.round(
                (completedLessons / totalLessons) * 100
              )
            : 0;

        let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

        if (completedLessons === 0) {
          status = "NOT_STARTED";
        } else if (
          completedLessons === totalLessons
        ) {
          status = "COMPLETED";
        } else {
          status = "IN_PROGRESS";
        }

        const nextLesson =
          lessons.find(
            (lesson) =>
              !progressRecords.some(
                (record) =>
                  record.lessonId === lesson.id &&
                  record.completed
              )
          ) ?? null;

        return {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          imageUrl: enrollment.course.imageUrl,
          price: enrollment.course.price.toString(),
          level: enrollment.course.level,
          duration: enrollment.course.duration,
          isPublished: enrollment.course.isPublished,

          category: enrollment.course.category
            ? {
                id: enrollment.course.category.id,
                name: enrollment.course.category.name,
              }
            : null,

          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            lastAccessedAt: enrollment.lastAccessedAt,
          },

          progress: {
            completedLessons,
            totalLessons,
            percentage: progress,
          },

          learningStatus: status,

          nextLesson: nextLesson
            ? {
                id: nextLesson.id,
                title: nextLesson.title,
                order: nextLesson.order,
              }
            : null,
        };
      })
    );

    const summary = {
      totalEnrolled: courses.length,
      completed: courses.filter(
        (course) =>
          course.learningStatus === "COMPLETED"
      ).length,
      inProgress: courses.filter(
        (course) =>
          course.learningStatus === "IN_PROGRESS"
      ).length,
      notStarted: courses.filter(
        (course) =>
          course.learningStatus === "NOT_STARTED"
      ).length,
    };

    res.status(200).json({
      summary,
      courses,
    });
  } catch (error) {
    console.error(
      "Error fetching my courses:",
      error
    );

    res.status(500).json({
      message: "Unable to load your courses",
    });
  }
};

export const enrollInCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    // Check that course exists
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found",
      });
      return;
    }

    // Check whether user is already enrolled
    const existingEnrollment =
      await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

    if (existingEnrollment) {
      res.status(409).json({
        message: "Already enrolled in this course",
        enrollment: existingEnrollment,
      });
      return;
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            level: true,
            duration: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll course error:", error);

    res.status(500).json({
      message: "Unable to enroll in course",
    });
  }
};


export const updateLessonProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const lessonId = Array.isArray(req.params.lessonId)
      ? req.params.lessonId[0]
      : req.params.lessonId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!lessonId) {
      res.status(400).json({
        message: "Lesson ID is required",
      });
      return;
    }

    const { completed, progressSeconds } = req.body;

    // Check lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      res.status(404).json({
        message: "Lesson not found",
      });
      return;
    }

    // Make sure user is enrolled in this lesson's course
    const enrollment =
      await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.courseId,
          },
        },
      });

    if (!enrollment) {
      res.status(403).json({
        message: "You are not enrolled in this course",
      });
      return;
    }

    // Create or update progress
    const progress =
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          completed: Boolean(completed),
          progressSeconds:
            typeof progressSeconds === "number"
              ? progressSeconds
              : 0,
          completedAt: completed
            ? new Date()
            : null,
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          completed: Boolean(completed),
          progressSeconds:
            typeof progressSeconds === "number"
              ? progressSeconds
              : 0,
          completedAt: completed
            ? new Date()
            : null,
          lastAccessedAt: new Date(),
        },
      });

    // Update course last accessed time
    await prisma.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        lastAccessedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Lesson progress updated",
      progress,
    });
  } catch (error) {
    console.error(
      "Update lesson progress error:",
      error
    );

    res.status(500).json({
      message: "Unable to update lesson progress",
    });
  }
};

export const getCourseProgress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const courseId = Array.isArray(req.params.courseId)
      ? req.params.courseId[0]
      : req.params.courseId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!courseId) {
      res.status(400).json({
        message: "Course ID is required",
      });
      return;
    }

    // Check whether the learner is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json({
        message: "You are not enrolled in this course",
      });
      return;
    }

    // Get published lessons for this course
    const lessons = await prisma.lesson.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        order: true,
        duration: true,
      },
    });

    // Get this learner's progress
    const progressRecords =
      await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: {
            in: lessons.map((lesson) => lesson.id),
          },
        },
        select: {
          lessonId: true,
          completed: true,
          progressSeconds: true,
          completedAt: true,
          lastAccessedAt: true,
        },
      });

    const progressMap = new Map(
      progressRecords.map((progress) => [
        progress.lessonId,
        progress,
      ])
    );

    // Add progress information to every lesson
    const lessonProgress = lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);

      return {
        lessonId: lesson.id,
        title: lesson.title,
        order: lesson.order,
        duration: lesson.duration,
        completed: progress?.completed ?? false,
        progressSeconds:
          progress?.progressSeconds ?? 0,
        completedAt:
          progress?.completedAt ?? null,
        lastAccessedAt:
          progress?.lastAccessedAt ?? null,
      };
    });

    const completedLessons = lessonProgress.filter(
      (lesson) => lesson.completed
    ).length;

    const totalLessons = lessonProgress.length;

    const percentage =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) * 100
          )
        : 0;

    // First incomplete lesson = resume lesson
    const nextLesson =
      lessonProgress.find(
        (lesson) => !lesson.completed
      ) ?? null;

    res.status(200).json({
      courseId,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt,
      },
      summary: {
        completedLessons,
        totalLessons,
        percentage,
      },
      nextLesson,
      lessons: lessonProgress,
    });
  } catch (error) {
    console.error(
      "Get course progress error:",
      error
    );

    res.status(500).json({
      message: "Unable to load course progress",
    });
  }
};