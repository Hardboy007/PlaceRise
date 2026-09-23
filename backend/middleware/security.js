// backend/middleware/security.js
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

// ── 1. Helmet (HTTP headers secure karta hai) ──
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Cloudinary images ke liye
});

// ── 2. Rate Limiters ──

// General API limit — har IP se 100 req/15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limit — 5 attempts/15 min (brute force rokne ke liye)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Resume generate limit — 10/hour per IP
const resumeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    message: "Resume generation limit reached, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limit — 20/hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Upload limit reached, please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── 3. Mongo Sanitize (NoSQL injection rokta hai) ──
const sanitizeMiddleware = mongoSanitize({
  replaceWith: "_", // $ aur . ko _ se replace karo
});

module.exports = {
  helmetMiddleware,
  generalLimiter,
  loginLimiter,
  resumeLimiter,
  uploadLimiter,
  sanitizeMiddleware,
};
