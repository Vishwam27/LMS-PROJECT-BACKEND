import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export const requireRole = (
  ...allowedRoles: UserRole[]
) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // User must already be authenticated
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    // Check user's role
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
};