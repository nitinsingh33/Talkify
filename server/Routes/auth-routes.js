const express = require("express");
const router = express.Router();

const {
  register,
  login,
  authUser,
  sendotp,
  sendVerificationOtp,
  verifyEmail,
} = require("../Controllers/auth-controller.js");
const fetchuser = require("../middleware/fetchUser.js");
const validate = require("../middleware/validate.js");
const {
  registerSchema,
  loginSchema,
  getotpSchema,
  verifyEmailSchema,
} = require("../validators/auth.schema.js");

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/getotp", validate({ body: getotpSchema }), sendotp);
router.get("/me", fetchuser, authUser);
router.post("/send-verification-otp", fetchuser, sendVerificationOtp);
router.post("/verify-email", fetchuser, validate({ body: verifyEmailSchema }), verifyEmail);

module.exports = router;
