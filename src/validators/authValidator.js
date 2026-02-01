const Joi = require("joi");
const  COMMON_MESSAGES  = require("../validators/validationConstants/commanMessages");

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .label("Email")
    .messages({
      "string.email": COMMON_MESSAGES.STRING_EMAIL,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  password: Joi.string()
    .min(8)
    .required()
    .label("Password")
    .messages({
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .label("Name")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .label("Phone number")
    .messages({
      "string.pattern.base": "Phone number must be 10 digits"
    })
    .optional(),

  gender: Joi.string()
    .valid("male", "female", "other")
    .label("Gender")
    .messages({
      "any.only": "{#label} must be male, female or other"
    })
    .optional(),

  profile_picture_url: Joi.string()
    .uri()
    .label("Profile picture URL")
    .messages({
      "string.uri": "{#label} must be a valid URL"
    })
    .optional(),

  role_id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Role ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
  ,
  address: Joi.string()
    .min(2)
    .max(50)
    .required()
    .label("Address")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
    ,
 
    postal_code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .label("Postal code")
    .messages({
      "string.pattern.base": "Postal code must be 6 digits"
    })
    .optional(),
    location: Joi.string()
    .min(2)
    .max(50)
    .required()
    .label("Location")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),
    date_of_birth: Joi.date()
    .required()
    .label("Date of birth")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .label("Email")
    .messages({
      "string.email": COMMON_MESSAGES.STRING_EMAIL,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  password: Joi.string()
    .required()
    .label("Password")
    .messages({
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
});

module.exports = {
  registerSchema,
  loginSchema
};
