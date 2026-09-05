const { z } = require("zod");
const mongoose = require("mongoose");

// A valid Mongo ObjectId string — catches typos/garbage before they reach a
// Mongoose query (which would otherwise throw an uncaught CastError).
const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid id",
});

const email = z.string().trim().toLowerCase().email("Invalid email address");

module.exports = { objectId, email };
