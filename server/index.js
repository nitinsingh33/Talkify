const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const http = require("http");
const connectDB = require("./db.js");
const { MONGO_URI, JWT_SECRET } = require("./secrets.js");
const logger = require("./utils/logger.js");
const app = require("./app.js");

// Fail fast with a clear message rather than crashing later in some
// unrelated request handler when a required secret turns out to be missing.
const REQUIRED_ENV = { MONGO_URI, JWT_SECRET };
const missingEnv = Object.entries(REQUIRED_ENV)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5500;
const { initSocket } = require("./socket/index.js");
const { startStaleOnlineUsersJob } = require("./jobs/staleOnlineUsers.js");

// Server setup
const server = http.createServer(app);

// Socket.io setup
initSocket(server); // Initialize socket.io logic

// Catch anything that slips past every try/catch so the process doesn't
// die silently or in an inconsistent state.
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

// Give in-flight requests/sockets a chance to finish before the process
// exits, instead of a container restart cutting them off mid-request.
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  // Force-exit if close() hangs (e.g. a socket refuses to drain)
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server and connect to database
const start = async () => {
  await connectDB(); // connect first
  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 Server started at http://localhost:${PORT}`);
  });
  // Start background jobs after DB is ready
  startStaleOnlineUsersJob();
};

start();
