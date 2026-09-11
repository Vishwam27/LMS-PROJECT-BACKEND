import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";

// =========================
// REGISTER
// =========================

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      termsAccepted,
    } = req.body;

    // ==========================================
    // 1. Check required fields
    // ==========================================

    if (!name || !email || !password) {
      res.status(400).json({
        message: "Name, email and password are required",
      });
      return;
    }

    // ==========================================
    // 2. Clean input
    // ==========================================

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // ==========================================
    // 3. Validate name
    // ==========================================

    if (trimmedName.length < 2) {
      res.status(400).json({
        message: "Name must be at least 2 characters",
      });
      return;
    }

    // ==========================================
    // 4. Validate email
    // Requires @ and .
    // ==========================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        message: "Please enter a valid email address",
      });
      return;
    }

    // ==========================================
    // 5. Validate password
    // ==========================================

    if (password.length < 8) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters",
      });
      return;
    }

    // One uppercase letter
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one uppercase letter",
      });
      return;
    }

    // One number
    if (!/[0-9]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one number",
      });
      return;
    }

    // One special character
    if (!/[^A-Za-z0-9]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one special character",
      });
      return;
    }

    // ==========================================
    // 6. Check Terms & Privacy acceptance
    // ==========================================

    if (termsAccepted !== true) {
      res.status(400).json({
        message:
          "You must accept the Terms of Service and Privacy Policy",
      });
      return;
    }

    // ==========================================
    // 7. Validate role
    // ==========================================

    if (role === "ADMIN") {
      res.status(403).json({
        message:
          "Admin accounts cannot be created through registration",
      });
      return;
    }

    const requestedRole =
      role === "INSTRUCTOR"
        ? "INSTRUCTOR"
        : "STUDENT";

    // ==========================================
    // 8. Check if user already exists
    // ==========================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      res.status(409).json({
        message: "An account with this email already exists",
      });
      return;
    }

    // ==========================================
    // 9. Hash password
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // ==========================================
    // 10. Decide account status
    // ==========================================

    const accountStatus =
      requestedRole === "INSTRUCTOR"
        ? "PENDING"
        : "APPROVED";

    // ==========================================
    // 11. Create user
    // ==========================================

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: requestedRole,
        status: accountStatus,
      },
    });

    // ==========================================
    // 12. Send response
    // ==========================================

    res.status(201).json({
      message:
        requestedRole === "INSTRUCTOR"
          ? "Instructor account created. Waiting for admin approval."
          : "Account created successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Unable to register user",
    });
  }
};



// =========================
// LOGIN
// =========================

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // User not found
    if (!user) {
      res.status(401).json({
        message: "Please Create New Account.",
      });
      return;
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    // Wrong password
    if (!passwordMatch) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }
    // =========================
// INSTRUCTOR STATUS CHECK
// =========================

if (user.role === "INSTRUCTOR") {
  if (user.status === "PENDING") {
    res.status(403).json({
      message:
        "Your instructor account is waiting for admin approval.",
      role: "INSTRUCTOR",
      status: "PENDING",
    });
    return;
  }

  if (user.status === "REJECTED") {
    res.status(403).json({
      message:
        "Your instructor application was not approved. You cannot become an instructor.",
      role: "INSTRUCTOR",
      status: "REJECTED",
    });
    return;
  }

  if (user.status !== "APPROVED") {
    res.status(403).json({
      message:
        "Your instructor account is not approved.",
    });
    return;
  }
}

const today = new Date();

    // Normalize to the start of the current day
    today.setHours(0, 0, 0, 0);

    await prisma.userDailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: user.id,
        date: today,
      },
    });


    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    // Login successful
   res.status(200).json({
  message: "Login successful",
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  },
});
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Unable to login",
    });
  }
};


export const getMe = async (
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

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Unable to get user",
    });
  }
};




export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { name, bio, avatarUrl } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({
        message: "Name is required",
      });
      return;
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name.trim(),
        bio: bio?.trim() || null,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Unable to update profile",
    });
  }
};
