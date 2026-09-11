import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/authMiddleware";
import { OAuth2Client } from "google-auth-library";

// =========================================================
// GOOGLE CLIENT
// =========================================================

const googleClient = new OAuth2Client();

// =========================================================
// REGISTER
// =========================================================

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
        message:
          "Name, email and password are required",
      });
      return;
    }

    // ==========================================
    // 2. Clean input
    // ==========================================

    const trimmedName = name.trim();
    const normalizedEmail =
      email.trim().toLowerCase();

    // ==========================================
    // 3. Validate name
    // ==========================================

    if (trimmedName.length < 2) {
      res.status(400).json({
        message:
          "Name must be at least 2 characters",
      });
      return;
    }

    // ==========================================
    // 4. Validate email
    // ==========================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({
        message:
          "Please enter a valid email address",
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

    if (!/[A-Z]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one uppercase letter",
      });
      return;
    }

    if (!/[0-9]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one number",
      });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      res.status(400).json({
        message:
          "Password must contain at least one special character",
      });
      return;
    }

    // ==========================================
    // 6. Terms & Privacy
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
    // 8. Check existing user
    // ==========================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      res.status(409).json({
        message:
          "An account with this email already exists",
      });
      return;
    }

    // ==========================================
    // 9. Hash password
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // ==========================================
    // 10. Decide status
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
    // 12. Response
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
    console.error(
      "Register error:",
      error
    );

    res.status(500).json({
      message: "Unable to register user",
    });
  }
};

// =========================================================
// LOGIN
// =========================================================

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // 1. Required fields
    // ==========================================

    if (!email || !password) {
      res.status(400).json({
        message:
          "Email and password are required",
      });
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // ==========================================
    // 2. Find user
    // ==========================================

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    // ==========================================
    // 3. User not found
    // ==========================================

    if (!user) {
      res.status(401).json({
        message:
          "Please Create New Account.",
      });
      return;
    }

    // ==========================================
    // 4. GOOGLE-ONLY ACCOUNT
    // ==========================================

    if (!user.password) {
      res.status(401).json({
        message:
          "This account uses Google Sign-In. Please use Google Sign-In to continue.",
        authMethod: "GOOGLE",
      });
      return;
    }

    // ==========================================
    // 5. Compare password
    // ==========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      res.status(401).json({
        message:
          "Invalid email or password",
      });
      return;
    }

    // ==========================================
    // 6. Instructor status
    // ==========================================

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

    // ==========================================
    // 7. Daily activity
    // ==========================================

    const today = new Date();

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

    // ==========================================
    // 8. Create JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET as string,

      {
        expiresIn: "5h",
      }
    );

    // ==========================================
    // 9. Response
    // ==========================================

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
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Unable to login",
    });
  }
};

// =========================================================
// GOOGLE LOGIN
// =========================================================

// =========================================================
// GOOGLE LOGIN
// =========================================================

export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;

    // ==========================================
    // 1. Validate credential
    // ==========================================

    if (
      !credential ||
      typeof credential !== "string"
    ) {
      res.status(400).json({
        message:
          "Google credential is required",
      });
      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error(
        "GOOGLE_CLIENT_ID is not configured"
      );

      res.status(500).json({
        message:
          "Google authentication is not configured",
      });
      return;
    }

    // ==========================================
    // 2. Verify Google access token
    // ==========================================

    const tokenInfo =
      await googleClient.getTokenInfo(
        credential
      );

    // ==========================================
    // 3. Verify token belongs to this app
    // ==========================================

    if (
      tokenInfo.aud !==
      process.env.GOOGLE_CLIENT_ID
    ) {
      res.status(401).json({
        message:
          "Invalid Google authentication token",
      });
      return;
    }

    // ==========================================
    // 4. Get Google profile
    // ==========================================

    const googleResponse =
      await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${credential}`,
          },
        }
      );

    if (!googleResponse.ok) {
      res.status(401).json({
        message:
          "Unable to retrieve Google account information",
      });
      return;
    }

    const googleUser =
      await googleResponse.json();

    // ==========================================
    // 5. Get Google stable user ID
    // ==========================================

    const googleId =
      typeof googleUser?.sub === "string"
        ? googleUser.sub
        : "";

    if (!googleId) {
      res.status(401).json({
        message:
          "Unable to identify Google account",
      });
      return;
    }

    // ==========================================
    // 6. Validate Google email
    // ==========================================

    const googleEmail =
      typeof googleUser?.email === "string"
        ? googleUser.email
            .trim()
            .toLowerCase()
        : "";

    const emailVerified =
      googleUser?.email_verified === true;

    if (!googleEmail) {
      res.status(400).json({
        message:
          "Google account email is not available",
      });
      return;
    }

    if (!emailVerified) {
      res.status(401).json({
        message:
          "Your Google email address could not be verified.",
      });
      return;
    }

    // ==========================================
    // 7. Google profile data
    // ==========================================

    const googleName =
      typeof googleUser?.name === "string" &&
      googleUser.name.trim()
        ? googleUser.name.trim()
        : "Google User";

    const googlePicture =
      typeof googleUser?.picture === "string"
        ? googleUser.picture
        : null;

    // ==========================================
    // 8. Find user by Google ID
    // ==========================================

    let user =
      await prisma.user.findUnique({
        where: {
          googleId,
        },
      });

    // ==========================================
    // 9. If not found, find by email
    // ==========================================

    if (!user) {
      user =
        await prisma.user.findUnique({
          where: {
            email: googleEmail,
          },
        });
    }

    // ==========================================
    // 10. Existing user
    // ==========================================

    if (user) {
      // ----------------------------------------
      // Google ID already belongs to another
      // Google account
      // ----------------------------------------

      if (
        user.googleId &&
        user.googleId !== googleId
      ) {
        res.status(409).json({
          message:
            "This email is already connected to another Google account.",
        });
        return;
      }

      // ----------------------------------------
      // Existing normal CourseMaster account
      // Link Google account
      // ----------------------------------------

      if (!user.googleId) {
        user =
          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              googleId,

              avatarUrl:
                user.avatarUrl ||
                googlePicture,
            },
          });
      }
    }

    // ==========================================
    // 11. Create new Google user
    // ==========================================

    if (!user) {
      user =
        await prisma.user.create({
          data: {
            name: googleName,

            email: googleEmail,

            // Google users don't have a
            // CourseMaster password.
            password: null,

            // IMPORTANT:
            // New Google users are ALWAYS STUDENTS.
            role: "STUDENT",

            // Students are approved automatically.
            status: "APPROVED",

            googleId,

            avatarUrl: googlePicture,
          },
        });
    }

    // ==========================================
    // 12. Instructor status protection
    // ==========================================

    if (
      user.role === "INSTRUCTOR" &&
      user.status !== "APPROVED"
    ) {
      res.status(403).json({
        message:
          "Your instructor account is not approved.",

        role: user.role,

        status: user.status,
      });

      return;
    }

    // ==========================================
    // 13. Track daily activity
    // ==========================================

    const today = new Date();

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

    // ==========================================
    // 14. Create CourseMaster JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },

      process.env.JWT_SECRET as string,

      {
        expiresIn: "5h",
      }
    );

    // ==========================================
    // 15. Response
    // ==========================================

    res.status(200).json({
      message:
        "Google login successful",

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
    console.error(
      "Google login error:",
      error
    );

    res.status(401).json({
      message:
        "Google authentication failed",
    });
  }
};

// =========================================================
// GET ME
// =========================================================

export const getMe = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message:
          "Authentication required",
      });
      return;
    }

    const user =
      await prisma.user.findUnique({
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
    console.error(
      "Get user error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to get user",
    });
  }
};

// =========================================================
// UPDATE PROFILE
// =========================================================

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId =
      (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        message:
          "Authentication required",
      });
      return;
    }

    const {
      name,
      bio,
      avatarUrl,
    } = req.body;

    if (
      !name ||
      name.trim() === ""
    ) {
      res.status(400).json({
        message: "Name is required",
      });
      return;
    }

    const user =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          name: name.trim(),
          bio: bio?.trim() || null,
          avatarUrl:
            avatarUrl || null,
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
      message:
        "Profile updated successfully",

      user,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to update profile",
    });
  }
};