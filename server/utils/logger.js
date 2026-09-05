const pino = require("pino");
const { NODE_ENV } = require("../secrets.js");
const { Sentry, isSentryEnabled } = require("./sentry.js");

/**
 * Structured logger. Emits pretty-printed, colorized lines in development;
 * plain single-line JSON in production so log lines are directly consumable
 * by any aggregator (CloudWatch, Datadog, etc.) without extra parsing.
 */
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  }),
});

// Every logger.error(...) call across the app already funnels through this
// one function — piggyback on it to report to Sentry too, instead of
// threading Sentry.captureException into every individual catch block.
// A no-op when SENTRY_DSN isn't configured.
if (isSentryEnabled) {
  const originalError = logger.error.bind(logger);
  logger.error = (...args) => {
    const [first] = args;
    const err = first && typeof first === "object" ? first.err : undefined;
    if (err instanceof Error) {
      Sentry.captureException(err);
    } else {
      const message = typeof first === "string" ? first : args.find((a) => typeof a === "string");
      if (message) Sentry.captureMessage(message, "error");
    }
    return originalError(...args);
  };
}

module.exports = logger;
