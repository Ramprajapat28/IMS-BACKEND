const Joi = require("joi");
const COMMON_MESSAGES = require("../validators/validationConstants/commanMessages");

const createItemSchema = Joi.object({
  remark: Joi.string().allow("", null).optional().label("Remark").messages({
    "string.base": COMMON_MESSAGES.STRING_BASE,
    "string.empty": COMMON_MESSAGES.STRING_EMPTY,
  }),

  product_id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Product ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  shelf_id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Shelf ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  quantity: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Quantity")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
});

const removeStockSchema = Joi.object({
  product_id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Product ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  quantity: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Quantity")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  remark: Joi.string().allow("", null).optional().label("Remark")
});

const paginationSchema = Joi.object({
  product_id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Product ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  page: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Page")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  limit: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Limit")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
});

const transferStockSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().label("Product ID"),
  quantity: Joi.number().integer().positive().required().label("Quantity"),
  source: Joi.object({
    shelf_id: Joi.number().integer().positive().allow(null, ""),
    rack_id: Joi.number().integer().positive().allow(null, "")
  }).required().label("Source Location"),
  destination: Joi.object({
    shelf_id: Joi.number().integer().positive().allow(null, ""),
    rack_id: Joi.number().integer().positive().allow(null, "")
  }).required().label("Destination Location"),
  remark: Joi.string().allow("", null).optional().label("Remark")
});

module.exports = {
  createItemSchema,
  removeStockSchema,
  paginationSchema,
  transferStockSchema
};
