import { Request, Response } from 'express'
import prisma from '../config/db'

export const getCourses = async (
  req: Request,
  res: Response
) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
      },
    })

    res.status(200).json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)

    res.status(500).json({
      message: 'Failed to fetch courses',
    })
  }
}

export const getCourseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courseId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    })

    if (!course) {
      res.status(404).json({
        message: 'Course not found',
      })
      return
    }

    res.status(200).json({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price.toString(),
      level: course.level,
      duration: course.duration,
      instructorId: course.instructorId,
      categoryId: course.categoryId,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching course:', error)

    res.status(500).json({
      message: 'Unable to load course',
    })
  }
}

export const getCourseLessons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courseId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        lessons: {
          where: {
            isPublished: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!course) {
      res.status(404).json({
        message: 'Course not found',
      })
      return
    }

    res.status(200).json({
      id: course.id,
      title: course.title,
      lessons: course.lessons,
    })
  } catch (error) {
    console.error('Error fetching lessons:', error)

    res.status(500).json({
      message: 'Unable to load lessons',
    })
  }
}