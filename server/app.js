const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const { CORS_ORIGIN } = require("./secrets.js");
const { notFound, errorHandler } = require("./middleware/errorHandler.js");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter.js");
const logger = require("./utils/logger.js");
// Importing this initializes Sentry as a side effect if SENTRY_DSN is set —
// a no-op otherwise. Must load before anything it might need to instrument.
const { Sentry, isSentryEnabled } = require("./utils/sentry.js");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(pinoHttp({ logger }));

// 2mb is generous for this API — images/files go through S3 presigned
// uploads, never through JSON bodies, so there's no legitimate need for more.
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));

app.use(apiLimiter);

// Routes
app.use("/health", require("./Routes/health-routes.js"));
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/auth", authLimiter, require("./Routes/auth-routes.js"));
app.use("/user", require("./Routes/user-routes.js"));
app.use("/message", require("./Routes/message-routes.js"));
app.use("/conversation", require("./Routes/conversation-routes.js"));

app.use(notFound);

// Captures errors that reach here (thrown/next(err)'d) and forwards them to
// our own errorHandler via next() — a no-op chain-through when Sentry isn't
// configured.
if (isSentryEnabled) Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

module.exports = app;
