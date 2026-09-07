import { Request, Response } from "express";
import prisma from "../config/db";

// =========================================================
// GET ALL CATEGORIES
// =========================================================

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    res.status(500).json({
      message: "Unable to load categories",
    });
  }
};