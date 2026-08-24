import Joi from "joi";

export const sendSignupOtpSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional().allow(''),
  phone: Joi.string().trim().min(7).max(24).optional().allow(''),
  email: Joi.string().trim().email().optional().allow(''),
  referralCode: Joi.string().trim().uppercase().optional().allow(''),
}).or('phone', 'email');

export const sendLoginOtpSchema = Joi.object({
  phone: Joi.string().trim().min(7).max(24).optional().allow(''),
  email: Joi.string().trim().email().optional().allow(''),
}).or('phone', 'email');

export const verifyOtpSchema = Joi.object({
  phone: Joi.string().trim().min(7).max(24).optional().allow(''),
  email: Joi.string().trim().email().optional().allow(''),
  otp: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
}).or('phone', 'email');

export function validateSchema(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (!error) return value;
  const err = new Error(error.details.map((item) => item.message).join("; "));
  err.statusCode = 400;
  throw err;
}
