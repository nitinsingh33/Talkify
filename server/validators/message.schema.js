const { z } = require("zod");
const { objectId } = require("./common.js");

const deleteMessageSchema = z.object({
  scope: z.enum(["me", "everyone"], {
    message: 'scope must be "me" or "everyone"',
  }),
});

const bulkHideSchema = z.object({
  messageIds: z.array(objectId).min(1, "messageIds must be a non-empty array"),
});

const idParamSchema = z.object({ id: objectId });
const conversationIdParamSchema = z.object({ conversationId: objectId });

module.exports = { deleteMessageSchema, bulkHideSchema, idParamSchema, conversationIdParamSchema };
