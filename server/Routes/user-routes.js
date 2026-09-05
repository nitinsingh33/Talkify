const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchUser.js");
const validate = require("../middleware/validate.js");

const {
  getPresignedUrl,
  getOnlineStatus,
  getNonFriendsList,
  getAllUsersList,
  updateprofile,
  blockUser,
  unblockUser,
  getBlockStatus,
  deleteAccount,
} = require("../Controllers/user-controller.js");
const {
  updateProfileSchema,
  idParamSchema,
  nonFriendsQuerySchema,
  allUsersQuerySchema,
  presignedUrlQuerySchema,
} = require("../validators/user.schema.js");

router.put("/update", fetchuser, validate({ body: updateProfileSchema }), updateprofile);
router.get(
  "/online-status/:id",
  fetchuser,
  validate({ params: idParamSchema }),
  getOnlineStatus
);
router.get(
  "/non-friends",
  fetchuser,
  validate({ query: nonFriendsQuerySchema }),
  getNonFriendsList
);
router.get("/all", fetchuser, validate({ query: allUsersQuerySchema }), getAllUsersList);
router.get(
  "/presigned-url",
  fetchuser,
  validate({ query: presignedUrlQuerySchema }),
  getPresignedUrl
);
router.post("/block/:id", fetchuser, validate({ params: idParamSchema }), blockUser);
router.delete("/block/:id", fetchuser, validate({ params: idParamSchema }), unblockUser);
router.get(
  "/block-status/:id",
  fetchuser,
  validate({ params: idParamSchema }),
  getBlockStatus
);
router.delete("/delete", fetchuser, deleteAccount);

module.exports = router;
