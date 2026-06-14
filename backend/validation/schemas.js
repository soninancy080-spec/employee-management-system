const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(6).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

const leaveSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  type: Joi.string().trim().uppercase().valid('SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY').required(),
  reason: Joi.string().trim().max(500).required(),
});

const assetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  serialNumber: Joi.string().trim().min(2).max(100).required(),
  type: Joi.string().trim().uppercase().valid('LAPTOP', 'MONITOR', 'IDCARD').required(),
});

const attendanceSchema = Joi.object({
  employeeId: Joi.number().integer().positive().required(),
  date: Joi.date().iso().required(),
  status: Joi.string().trim().uppercase().valid('PRESENT', 'ABSENT', 'LATE').required(),
  lateReason: Joi.string().trim().max(255).allow(null, '').optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required(),
  password: Joi.string().min(6).max(100).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  leaveSchema,
  assetSchema,
  attendanceSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
