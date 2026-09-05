const rateLimit = require("express-rate-limit");
const { NODE_ENV } = require("../secrets.js");

// Test suites fire far more requests at auth endpoints in a few seconds than
// any real client would in 15 minutes — use effectively-unlimited caps under
// test so the limiter's behavior doesn't leak between unrelated test cases.
const isTest = NODE_ENV === "test";

/**
 * Tight limiter for auth-sensitive endpoints (login, register, OTP request/
 * verify). These are the endpoints most worth protecting from brute-force /
 * spam since they touch passwords, OTPs, and (for OTP routes) outbound email.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 100_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

/**
 * Looser, general-purpose limiter applied to the whole API as a baseline
 * guard against abuse/scraping. Real-time chat traffic goes over Socket.IO,
 * not REST, so normal usage stays well under this.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100_000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

module.exports = { authLimiter, apiLimiter };
