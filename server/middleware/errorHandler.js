const { NODE_ENV } = require("../secrets.js");
const logger = require("../utils/logger.js");

/**
 * Catches requests to routes that don't exist and turns them into a
 * consistent JSON 404 instead of Express's default HTML page.
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Final error-handling middleware. Most controllers already catch their own
 * errors, but this is the safety net for anything that slips through —
 * malformed JSON bodies (express.json() throws a SyntaxError), errors thrown
 * in middleware, or a future controller that forgets a try/catch.
 * Must be registered last, after all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error({ err }, "Unhandled error");

  const status = err.statusCode || (err.type === "entity.parse.failed" ? 400 : 500);
  const message =
    err.type === "entity.parse.failed"
      ? "Malformed JSON body"
      : status < 500
        ? err.message
        : "Internal Server Error";

  const body = { error: message };
  if (NODE_ENV !== "production") body.stack = err.stack;

  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
