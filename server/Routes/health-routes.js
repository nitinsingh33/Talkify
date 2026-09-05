const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Mirrors mongoose.ConnectionStates for a readable response without an extra import.
const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

router.get("/", (req, res) => {
  const dbState = DB_STATES[mongoose.connection.readyState] || "unknown";
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: dbState,
  });
});

module.exports = router;
