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

router.post("/", fetchuser, createConversation);
router.get("/", fetchuser, getConversationList);
router.post("/group", fetchuser, createGroup);
router.get("/:id", fetchuser, getConversation);
router.post("/:id/pin", fetchuser, togglePin);
router.put("/:id/group", fetchuser, updateGroupInfo);
router.post("/:id/members", fetchuser, addMembers);
router.delete("/:id/members/:userId", fetchuser, removeMember);
router.post("/:id/leave", fetchuser, leaveGroup);
router.post("/:id/admins/:userId", fetchuser, promoteAdmin);
router.delete("/:id/admins/:userId", fetchuser, demoteAdmin);

module.exports = router;
