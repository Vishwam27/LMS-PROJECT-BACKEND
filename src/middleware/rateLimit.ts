import rateLimit from "express-rate-limit";

// Login
export const loginRateLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_WINDOWS_TIME ?? 15 * 60 * 1000), // 15 minutes
  limit: Number(process.env.RATE_LIMIT ?? 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many login attempts. Please try again later.",
  },
});

// Register
export const registerRateLimiter = rateLimit({
  windowMs:  Number(process.env.LOGIN_WINDOWS_TIME ?? 60 * 60 * 1000), // 1 hour
  limit:  Number(process.env.RATE_LIMIT ?? 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many registration attempts. Please try again later.",
  },
});

// Google Login
export const googleRateLimiter = rateLimit({
  windowMs:Number(process.env.LOGIN_WINDOWS_TIME ?? 15 * 60 * 1000), // 15 minutes
  limit:  Number(process.env.RATE_LIMIT ?? 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many Google login attempts. Please try again later.",
  },
});