const { z } = require("zod");
const { objectId } = require("./common.js");

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(50, "Name is too long").optional(),
    about: z.string().trim().max(200, "About is too long").optional(),
    profilePic: z.string().trim().optional(),
    oldpassword: z.string().optional(),
    newpassword: z.string().min(6, "Password must be at least 6 characters").optional(),
    emailNotificationsEnabled: z.boolean().optional(),
  })
  .refine((data) => !data.newpassword || !!data.oldpassword, {
    message: "Current password is required to set a new password",
    path: ["oldpassword"],
  });

const idParamSchema = z.object({ id: objectId });

const nonFriendsQuerySchema = z.object({
  search: z.string().trim().optional(),
  sort: z.enum(["name_asc", "name_desc", "last_seen_recent", "last_seen_oldest"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const allUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const presignedUrlQuerySchema = z.object({
  filename: z.string().trim().min(1, "Filename and filetype are required"),
  filetype: z.string().trim().refine((v) => v.startsWith("image/"), {
    message: "Invalid file type",
  }),
});

module.exports = {
  updateProfileSchema,
  idParamSchema,
  nonFriendsQuerySchema,
  allUsersQuerySchema,
  presignedUrlQuerySchema,
};
