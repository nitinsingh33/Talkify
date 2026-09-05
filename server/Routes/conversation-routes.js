const express = require("express");
const router = express.Router();

const {
  createConversation,
  getConversation,
  getConversationList,
  togglePin,
  createGroup,
  updateGroupInfo,
  addMembers,
  removeMember,
  leaveGroup,
  promoteAdmin,
  demoteAdmin,
} = require("../Controllers/conversation-controller.js");
const fetchuser = require("../middleware/fetchUser.js");
const validate = require("../middleware/validate.js");
const {
  createConversationSchema,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  idParamSchema,
  memberParamSchema,
} = require("../validators/conversation.schema.js");

router.post("/", fetchuser, validate({ body: createConversationSchema }), createConversation);
router.get("/", fetchuser, getConversationList);
router.post("/group", fetchuser, validate({ body: createGroupSchema }), createGroup);
router.get("/:id", fetchuser, validate({ params: idParamSchema }), getConversation);
router.post("/:id/pin", fetchuser, validate({ params: idParamSchema }), togglePin);
router.put(
  "/:id/group",
  fetchuser,
  validate({ params: idParamSchema, body: updateGroupSchema }),
  updateGroupInfo
);
router.post(
  "/:id/members",
  fetchuser,
  validate({ params: idParamSchema, body: addMembersSchema }),
  addMembers
);
router.delete(
  "/:id/members/:userId",
  fetchuser,
  validate({ params: memberParamSchema }),
  removeMember
);
router.post("/:id/leave", fetchuser, validate({ params: idParamSchema }), leaveGroup);
router.post(
  "/:id/admins/:userId",
  fetchuser,
  validate({ params: memberParamSchema }),
  promoteAdmin
);
router.delete(
  "/:id/admins/:userId",
  fetchuser,
  validate({ params: memberParamSchema }),
  demoteAdmin
);

module.exports = router;
