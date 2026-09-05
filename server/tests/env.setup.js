// Runs before the test framework loads any test file, so app modules that
// read process.env at require-time (secrets.js) see these values.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_do_not_use_in_production";
process.env.CORS_ORIGIN = "*";
process.env.LOG_LEVEL = "silent";
