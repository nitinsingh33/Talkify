module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/env.setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  // mongodb-memory-server's first-run binary download/extraction can be slow.
  testTimeout: 30000,
};
