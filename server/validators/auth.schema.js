const { z } = require("zod");
const { email } = require("./common.js");

const registerSchema = z.object({
  name: z
    .string({ error: "Please fill all the fields" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name is too long"),
  email,
  password: z.string({ error: "Please fill all the fields" }).min(6, "Password must be at least 6 characters"),
});

const loginSchema = z
  .object({
    email,
    password: z.string().min(1).optional(),
    otp: z.union([z.string(), z.number()]).optional(),
  })
  .refine((data) => !!data.password || !!data.otp, {
    message: "Please fill all the fields",
    path: ["password"],
  });

const getotpSchema = z.object({ email });

const verifyEmailSchema = z.object({
  otp: z.union([z.string(), z.number()]),
});

module.exports = { registerSchema, loginSchema, getotpSchema, verifyEmailSchema };
