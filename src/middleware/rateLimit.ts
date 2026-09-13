import rateLimit from "express-rate-limit";

// Login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many login attempts. Please try again later.",
  },
});

// Register
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many registration attempts. Please try again later.",
  },
});

// Google Login
export const googleRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many Google login attempts. Please try again later.",
  },
});