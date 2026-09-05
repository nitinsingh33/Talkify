const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../secrets.js");
const logger = require("../utils/logger.js");

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    logger.warn("Request rejected: no auth token provided");
    return res.status(401).send("Please authenticate using a valid token");
  } else {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      logger.warn({ err: error }, "Request rejected: invalid auth token");
      return res.status(401).send("Please authenticate using a valid token");
    }
  }
};

module.exports = fetchuser;
