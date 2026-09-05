const express = require("express");
const router = express.Router();

const {
  allMessage,
  deleteMessage,
  bulkHide,
  clearChat,
  toggleStar,
  getStarredMessages,
} = require("../Controllers/message-controller.js");
const fetchuser = require("../middleware/fetchUser.js");
const validate = require("../middleware/validate.js");
const {
  deleteMessageSchema,
  bulkHideSchema,
  idParamSchema,
  conversationIdParamSchema,
} = require("../validators/message.schema.js");

router.get("/starred", fetchuser, getStarredMessages);
router.get("/:id", fetchuser, validate({ params: idParamSchema }), allMessage);
router.delete("/bulk/hide", fetchuser, validate({ body: bulkHideSchema }), bulkHide);
router.delete(
  "/:id",
  fetchuser,
  validate({ params: idParamSchema, body: deleteMessageSchema }),
  deleteMessage
);
router.post(
  "/clear/:conversationId",
  fetchuser,
  validate({ params: conversationIdParamSchema }),
  clearChat
);
router.post("/:id/star", fetchuser, validate({ params: idParamSchema }), toggleStar);

module.exports = router;
