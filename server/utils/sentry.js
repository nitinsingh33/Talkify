const Sentry = require("@sentry/node");
const { SENTRY_DSN, NODE_ENV } = require("../secrets.js");

const isSentryEnabled = !!SENTRY_DSN;

if (isSentryEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    // Keep trace sampling low in production — this app doesn't need full
    // request tracing, just error visibility.
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 0,
  });
}

module.exports = { Sentry, isSentryEnabled };
