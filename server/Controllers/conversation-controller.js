const Conversation = require("../Models/Conversation.js");
const User = require("../Models/User.js");
const { getIO } = require("../socket/index.js");
const logger = require("../utils/logger.js");

/**
 * Notifies every member of a group (except optionally the actor) that the
 * group's data changed, so their clients can refetch. Never throws — this is
 * a best-effort real-time nicety, not a source of truth.
 */
function broadcastGroupUpdate(conversation) {
  try {
    const io = getIO();
    if (!io) return;
    conversation.members.forEach((memberId) => {
      io.to(memberId.toString()).emit("group-updated", {
        conversationId: conversation._id.toString(),
      });
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to broadcast group update");
  }
}

/**
 * Sanitizes a populated member document when viewed by someone whom that
 * member has blocked. Profile fields become generic placeholders; only the
 * _id and email remain untouched (per product spec).
 * The `blockedUsers` array is always stripped from the output.
 */
function sanitizeForRequester(member, requesterId) {
  const obj = member.toObject ? member.toObject() : { ...member };
  const isBlocked = obj.blockedUsers?.some(
    (id) => id.toString() === requesterId.toString()
  );
  delete obj.blockedUsers; // never expose blockedUsers list to clients

  if (!isBlocked) return obj;

  return {
    _id: obj._id,
    email: obj.email, // email is intentionally NOT sanitized
    name: "Talkify User",
    about: "",
    profilePic: "https://ui-avatars.com/api/?name=Talkify+User&background=6366f1&color=fff&bold=true",
    isOnline: false,
    lastSeen: null,
    isBot: obj.isBot,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Group members are never block-sanitized (blocking is a DM-only concept
 * here) — we just strip the blockedUsers list, which should never reach
 * clients regardless of context.
 */
function sanitizeGroupMember(member) {
  const obj = member.toObject ? member.toObject() : { ...member };
  delete obj.blockedUsers;
  return obj;
}

const DEFAULT_GROUP_PIC =
  "https://ui-avatars.com/api/?name=Group&background=6366f1&color=fff&bold=true";

/**
 * Ensures the requester is an admin of the given group conversation.
 * Returns { conversation } on success, or { status, error } on failure.
 */
async function requireGroupAdmin(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { status: 404, error: "Conversation not found" };
  if (!conversation.isGroup) return { status: 400, error: "Not a group conversation" };
  const isAdmin = conversation.groupAdmins.some((a) => a.toString() === userId);
  if (!isAdmin) return { status: 403, error: "Only group admins can do this" };
  return { conversation };
}

const createConversation = async (req, res) => {
  try {
    const { members: memberIds } = req.body;

    if (!memberIds) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const conv = await Conversation.findOne({
      members: { $all: memberIds, $size: memberIds.length },
    }).populate("members", "-password");

    if (conv) {
      const sanitizedConv = conv.toObject();
      sanitizedConv.members = conv.members
        .filter((member) => member._id.toString() !== req.user.id)
        .map((member) => sanitizeForRequester(member, req.user.id));
      return res.status(200).json(sanitizedConv);
    }

    const newConversation = await Conversation.create({
      members: memberIds,
      unreadCounts: memberIds.map((memberId) => ({
        userId: memberId,
        count: 0,
      })),
    });

    await newConversation.populate("members", "-password");

    const sanitizedNew = newConversation.toObject();
    sanitizedNew.members = newConversation.members
      .filter((member) => member._id.toString() !== req.user.id)
      .map((member) => sanitizeForRequester(member, req.user.id));

    return res.status(200).json(sanitizedNew);
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    return res.status(500).send("Internal Server Error");
  }
};

const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "members",
      "-password",
    );

    if (!conversation) {
      return res.status(404).json({
        error: "No conversation found",
      });
    }

    // Ensure the requesting user is a member
    const isMember = conversation.members.some(
      (m) => m._id.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sanitized = conversation.toObject();
    // Groups keep every member (including self) — the UI needs the full
    // roster. 1:1 chats keep the existing block-sanitization behavior.
    sanitized.members = conversation.isGroup
      ? conversation.members.map((m) => sanitizeGroupMember(m))
      : conversation.members.map((m) => sanitizeForRequester(m, req.user.id));
    res.status(200).json(sanitized);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const getConversationList = async (req, res) => {
  const userId = req.user.id;

  try {
    const currentUser = await User.findById(userId).select("pinnedConversations");
    const pinnedSet = new Set((currentUser.pinnedConversations || []).map((id) => id.toString()));

    const conversationList = await Conversation.find({
      members: { $in: userId },
    })
      .populate("members", "-password")
      .sort({ updatedAt: -1 });

    if (!conversationList) {
      return res.status(404).json({ error: "No conversation found" });
    }

    // Build response: annotate isPinned
    let result = [];
    for (let i = 0; i < conversationList.length; i++) {
      const convId = conversationList[i]._id.toString();

      const conv = conversationList[i].toObject();
      conv.members = conv.isGroup
        ? conversationList[i].members.map((member) => sanitizeGroupMember(member))
        : conversationList[i].members
            .filter((member) => member.id !== userId)
            .map((member) => sanitizeForRequester(member, userId));
      conv.isPinned = pinnedSet.has(convId);
      result.push(conv);
    }

    // Sort: pinned first, then by updatedAt (already sorted by mongo)
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const togglePin = async (req, res) => {
  const userId = req.user.id;
  const convId = req.params.id;

  try {
    const conversation = await Conversation.findById(convId);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const isMember = conversation.members.some((m) => m.toString() === userId);
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    const user = await User.findById(userId).select("pinnedConversations");
    const isPinned = user.pinnedConversations.some((id) => id.toString() === convId);

    if (isPinned) {
      await User.findByIdAndUpdate(userId, { $pull: { pinnedConversations: convId } });
      return res.status(200).json({ isPinned: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { pinnedConversations: convId } });
      return res.status(200).json({ isPinned: true });
    }
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, members: memberIds, groupPic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }
    if (!Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ error: "A group needs at least 2 other members" });
    }

    const uniqueMembers = Array.from(new Set([...memberIds, req.user.id]));

    const group = await Conversation.create({
      members: uniqueMembers,
      isGroup: true,
      groupName: name.trim(),
      groupPic: groupPic || DEFAULT_GROUP_PIC,
      groupAdmins: [req.user.id],
      createdBy: req.user.id,
      unreadCounts: uniqueMembers.map((id) => ({ userId: id, count: 0 })),
    });

    await group.populate("members", "-password");
    const sanitized = group.toObject();
    sanitized.members = group.members.map((m) => sanitizeGroupMember(m));

    broadcastGroupUpdate(group);
    res.status(201).json(sanitized);
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const updateGroupInfo = async (req, res) => {
  try {
    const { name, groupPic } = req.body;
    const { conversation, status, error } = await requireGroupAdmin(req.params.id, req.user.id);
    if (error) return res.status(status).json({ error });

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "Group name cannot be empty" });
      conversation.groupName = name.trim();
    }
    if (groupPic !== undefined) conversation.groupPic = groupPic;

    await conversation.save();
    broadcastGroupUpdate(conversation);
    res.status(200).json({ groupName: conversation.groupName, groupPic: conversation.groupPic });
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const addMembers = async (req, res) => {
  try {
    const { members: newMemberIds } = req.body;
    if (!Array.isArray(newMemberIds) || newMemberIds.length === 0) {
      return res.status(400).json({ error: "members must be a non-empty array" });
    }

    const { conversation, status, error } = await requireGroupAdmin(req.params.id, req.user.id);
    if (error) return res.status(status).json({ error });

    const toAdd = newMemberIds.filter(
      (id) => !conversation.members.some((m) => m.toString() === id)
    );
    conversation.members.push(...toAdd);
    conversation.unreadCounts.push(...toAdd.map((id) => ({ userId: id, count: 0 })));
    await conversation.save();

    await conversation.populate("members", "-password");
    const sanitized = conversation.toObject();
    sanitized.members = conversation.members.map((m) => sanitizeGroupMember(m));

    broadcastGroupUpdate(conversation);
    res.status(200).json(sanitized);
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const removeMember = async (req, res) => {
  try {
    const { conversation, status, error } = await requireGroupAdmin(req.params.id, req.user.id);
    if (error) return res.status(status).json({ error });

    const targetId = req.params.userId;
    if (targetId === conversation.createdBy?.toString()) {
      return res.status(400).json({ error: "Cannot remove the group creator" });
    }

    conversation.members = conversation.members.filter((m) => m.toString() !== targetId);
    conversation.groupAdmins = conversation.groupAdmins.filter((a) => a.toString() !== targetId);
    conversation.unreadCounts = conversation.unreadCounts.filter(
      (u) => u.userId.toString() !== targetId
    );
    await conversation.save();

    broadcastGroupUpdate(conversation);
    // Also let the removed member know so their client drops the conversation
    try {
      const io = getIO();
      if (io) io.to(targetId).emit("group-updated", { conversationId: conversation._id.toString(), removed: true });
    } catch { /* best-effort */ }

    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ error: "Not a group conversation" });

    const isMember = conversation.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    conversation.members = conversation.members.filter((m) => m.toString() !== req.user.id);
    conversation.groupAdmins = conversation.groupAdmins.filter((a) => a.toString() !== req.user.id);
    conversation.unreadCounts = conversation.unreadCounts.filter(
      (u) => u.userId.toString() !== req.user.id
    );

    // If the last admin just left, promote the earliest remaining member so
    // the group is never left without one.
    if (conversation.groupAdmins.length === 0 && conversation.members.length > 0) {
      conversation.groupAdmins.push(conversation.members[0]);
    }

    await conversation.save();
    broadcastGroupUpdate(conversation);
    res.status(200).json({ message: "Left group" });
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const promoteAdmin = async (req, res) => {
  try {
    const { conversation, status, error } = await requireGroupAdmin(req.params.id, req.user.id);
    if (error) return res.status(status).json({ error });

    const targetId = req.params.userId;
    const isMember = conversation.members.some((m) => m.toString() === targetId);
    if (!isMember) return res.status(400).json({ error: "User is not a member of this group" });

    if (!conversation.groupAdmins.some((a) => a.toString() === targetId)) {
      conversation.groupAdmins.push(targetId);
      await conversation.save();
      broadcastGroupUpdate(conversation);
    }
    res.status(200).json({ groupAdmins: conversation.groupAdmins });
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

const demoteAdmin = async (req, res) => {
  try {
    const { conversation, status, error } = await requireGroupAdmin(req.params.id, req.user.id);
    if (error) return res.status(status).json({ error });

    const targetId = req.params.userId;
    if (targetId === conversation.createdBy?.toString()) {
      return res.status(400).json({ error: "Cannot demote the group creator" });
    }

    conversation.groupAdmins = conversation.groupAdmins.filter((a) => a.toString() !== targetId);
    await conversation.save();
    broadcastGroupUpdate(conversation);
    res.status(200).json({ groupAdmins: conversation.groupAdmins });
  } catch (error) {
    logger.error({ err: error }, "Conversation controller error");
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
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
};
