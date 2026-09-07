import { Request, Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

export const getDashboard = async (
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

    // =========================================================
    // USER
    // =========================================================

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    // =========================================================
    // ENROLLED COURSES
    // =========================================================

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
        lastAccessedAt: "desc",
      },
    });

    // =========================================================
    // PROGRESS FOR ALL ENROLLED LESSONS
    // =========================================================

    const enrolledLessonIds = enrollments.flatMap(
      (enrollment) =>
        enrollment.course.lessons.map(
          (lesson) => lesson.id
        )
    );

    const progressRecords =
      enrolledLessonIds.length > 0
        ? await prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: {
                in: enrolledLessonIds,
              },
            },
            select: {
              lessonId: true,
              completed: true,
              completedAt: true,
              lastAccessedAt: true,
            },
          })
        : [];

    const progressMap = new Map(
      progressRecords.map((progress) => [
        progress.lessonId,
        progress,
      ])
    );

    // =========================================================
    // BUILD ENROLLED COURSE DATA
    // =========================================================

    const enrolledCourses = enrollments.map(
      (enrollment) => {
        const lessons = enrollment.course.lessons;

        const completedLessons = lessons.filter(
          (lesson) =>
            progressMap.get(lesson.id)?.completed === true
        ).length;

        const totalLessons = lessons.length;

        const percentage =
          totalLessons > 0
            ? Math.round(
                (completedLessons / totalLessons) * 100
              )
            : 0;

        const nextLesson =
          lessons.find(
            (lesson) =>
              progressMap.get(lesson.id)?.completed !==
              true
          ) ?? null;

        let learningStatus:
          | "NOT_STARTED"
          | "IN_PROGRESS"
          | "COMPLETED";

        if (completedLessons === 0) {
          learningStatus = "NOT_STARTED";
        } else if (
          completedLessons === totalLessons &&
          totalLessons > 0
        ) {
          learningStatus = "COMPLETED";
        } else {
          learningStatus = "IN_PROGRESS";
        }

        return {
          id: enrollment.course.id,
          title: enrollment.course.title,
          imageUrl: enrollment.course.imageUrl,
          category:
            enrollment.course.category?.name ?? null,

          progress: percentage,
          completedLessons,
          totalLessons,

          learningStatus,

          nextLesson: nextLesson
            ? {
                id: nextLesson.id,
                title: nextLesson.title,
              }
            : null,

          lastAccessedAt:
            enrollment.lastAccessedAt,
        };
      }
    );

    // =========================================================
    // STATS
    // =========================================================

    const totalEnrolled =
      enrolledCourses.length;

    const completedCourses =
      enrolledCourses.filter(
        (course) =>
          course.learningStatus === "COMPLETED"
      ).length;

    const inProgressCourses =
      enrolledCourses.filter(
        (course) =>
          course.learningStatus === "IN_PROGRESS"
      ).length;

    const totalLessons =
      enrolledCourses.reduce(
        (total, course) =>
          total + course.totalLessons,
        0
      );

    const completedLessons =
      enrolledCourses.reduce(
        (total, course) =>
          total + course.completedLessons,
        0
      );

    const overallProgress =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) *
              100
          )
        : 0;

    // =========================================================
    // CONTINUE LEARNING
    // =========================================================

    const continueLearning = enrolledCourses
      .filter(
        (course) =>
          course.learningStatus === "IN_PROGRESS"
      )
      .sort((a, b) => {
        const aDate = a.lastAccessedAt
          ? new Date(a.lastAccessedAt).getTime()
          : 0;

        const bDate = b.lastAccessedAt
          ? new Date(b.lastAccessedAt).getTime()
          : 0;

        return bDate - aDate;
      })
      .slice(0, 3);

    // =========================================================
    // RECOMMENDED COURSES
    // =========================================================

    const enrolledCourseIds =
      enrollments.map(
        (enrollment) => enrollment.courseId
      );

    const recommendedCourses =
      await prisma.course.findMany({
        where: {
          isPublished: true,
          ...(enrolledCourseIds.length > 0
            ? {
                id: {
                  notIn: enrolledCourseIds,
                },
              }
            : {}),
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      });

    const formattedRecommendedCourses =
      recommendedCourses.map((course) => ({
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        price: course.price.toString(),
        level: course.level,
        duration: course.duration,
        category: course.category
          ? {
              id: course.category.id,
              name: course.category.name,
            }
          : null,
      }));
// =========================================================
// WEEKLY ACTIVITY
// =========================================================

const now = new Date();

const startOfWeek = new Date(now);

const day = startOfWeek.getDay();

// Sunday = first day of week
startOfWeek.setDate(
  startOfWeek.getDate() - day
);

startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(startOfWeek);

endOfWeek.setDate(
  endOfWeek.getDate() + 7
);

const dailyActivities =
  await prisma.userDailyActivity.findMany({
    where: {
      userId,
      date: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

const activeDates = new Set(
  dailyActivities.map(
    (activity) =>
      activity.date.toISOString().split("T")[0]
  )
);

const todayKey =
  now.toISOString().split("T")[0];

const weeklyActivity = Array.from({
  length: 7,
}).map((_, index) => {
  const date = new Date(startOfWeek);

  date.setDate(
    startOfWeek.getDate() + index
  );

  const dateKey =
    date.toISOString().split("T")[0];

  return {
    date: dateKey,
    day: date.toLocaleDateString("en-US", {
      weekday: "short",
    }),
    active: activeDates.has(dateKey),
    isToday: dateKey === todayKey,
  };
});

    // =========================================================
    // RESPONSE
    // =========================================================

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },

      stats: {
        coursesEnrolled: totalEnrolled,
        completedCourses,
        inProgressCourses,
        overallProgress,
      },

      continueLearning,

      recommendedCourses:
        formattedRecommendedCourses,

      weeklyActivity,
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message: "Unable to load dashboard",
    });
  }
};