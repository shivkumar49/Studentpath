/**
 * EduPath — middleware/validate.js
 * Request validation helpers
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const sanitizeBody = (allowedFields) => (req, res, next) => {
  const sanitized = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) sanitized[f] = req.body[f]; });
  req.body = sanitized;
  next();
};

const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f] && req.body[f] !== 0);
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      errors: missing.map(f => ({ field: f, message: `${f} is required` })),
    });
  }
  next();
};

const validateObjectId = (req, res, next) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
    return res.status(400).json({ success: false, error: `Invalid ID: "${req.params.id}"` });
  }
  next();
};

const parsePagination = (defaultLimit = 20, maxLimit = 100) => (req, res, next) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(maxLimit, parseInt(req.query.limit) || defaultLimit);
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

module.exports = { validate, sanitizeBody, requireFields, validateObjectId, parsePagination };