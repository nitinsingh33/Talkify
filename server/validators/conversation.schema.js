const { z } = require("zod");
const { objectId } = require("./common.js");

const createConversationSchema = z.object({
  members: z.array(objectId).min(2, "A conversation needs at least 2 members"),
});

const createGroupSchema = z.object({
  name: z
    .string({ error: "Group name is required" })
    .trim()
    .min(1, "Group name is required")
    .max(100, "Group name is too long"),
  members: z.array(objectId).min(2, "A group needs at least 2 other members"),
  groupPic: z.string().trim().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name cannot be empty").max(100, "Group name is too long").optional(),
  groupPic: z.string().trim().optional(),
});

const addMembersSchema = z.object({
  members: z.array(objectId).min(1, "members must be a non-empty array"),
});

const idParamSchema = z.object({ id: objectId });
const memberParamSchema = z.object({ id: objectId, userId: objectId });

module.exports = {
  createConversationSchema,
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  idParamSchema,
  memberParamSchema,
};
