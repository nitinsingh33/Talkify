/**
 * Generic Zod-backed validation middleware.
 * Usage: router.post("/x", validate({ body: schema }), controller)
 * On success, req.body/params/query are replaced with the parsed (and
 * coerced/defaulted) values. On failure, responds 400 with a flat list of
 * field-level messages instead of reaching the controller at all.
 */
const validate = (schemas) => (req, res, next) => {
  for (const key of ["body", "params", "query"]) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || key,
        message: issue.message,
      }));
      return res.status(400).json({ error: errors[0].message, errors });
    }
    req[key] = result.data;
  }
  next();
};

module.exports = validate;
