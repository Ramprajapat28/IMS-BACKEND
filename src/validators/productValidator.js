const Joi = require("joi");
const COMMON_MESSAGES = require("../validators/validationConstants/commanMessages");

// ✅ Product ID schema
const productIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .label("Product ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    })
});

// ✅ Schema for creating product
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .label("Product name")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  sku: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .label("SKU")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX,
      "any.required": COMMON_MESSAGES.ANY_REQUIRED
    }),

  description: Joi.string()
    .allow("", null)
    .label("Description")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),

  barcode: Joi.string()
    .optional()
    .label("Barcode")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),
  category: Joi.string()
    .trim()
    .when('category_id', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .label("Category")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "any.required": "Category name is required if Category ID is not provided"
    }),

  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .label("Category ID"),
  size: Joi.string()
    .trim()
    .allow("", null)
    .label("Size")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "string.min": COMMON_MESSAGES.STRING_MIN,

    })
    .optional(),

  // product_image: Joi.string()
  //   .allow("", null)
  //   .label("Product Image")
  //   .messages({
  //     "string.base": COMMON_MESSAGES.STRING_BASE
  //   })


  // ✅ Multiple product images (array of objects)
  product_image: Joi.array()
    .items(
      Joi.object({
        file_path: Joi.string().uri().required().label("Product Image Path"),
        view: Joi.string().trim().required().label("Image View")
      })
    )
    .optional()
    .label("Product Images"),

  // ✅ Barcode image (object with file_path)
  barcode_image: Joi.object({
    file_path: Joi.string().uri().required().label("Barcode Image Path")
  })
    .optional()
    .label("Barcode Image"),

  barcode: Joi.string()
    .optional()
    .label("Barcode")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),
  product_code: Joi.string().trim().allow("", null).optional().label("Product Code"),
  mrp: Joi.number().allow(0, null).optional().label("MRP"),
  discounted_price: Joi.number().allow(0, null).optional().label("Discounted Price"),
  gst_percentage: Joi.number().allow(0, null).optional().label("GST Percentage"),
  cost_to_company: Joi.number().allow(0, null).optional().label("Cost to Company"),
  reorder_level: Joi.number().integer().min(0).default(10).optional().label("Reorder Level")
});

// ✅ Schema for updating product
const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .label("Product name")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX
    }),

  sku: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .label("SKU")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE,
      "string.empty": COMMON_MESSAGES.STRING_EMPTY,
      "string.min": COMMON_MESSAGES.STRING_MIN,
      "string.max": COMMON_MESSAGES.STRING_MAX
    }),

  description: Joi.string()
    .allow("", null)
    .label("Description")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),

  category: Joi.string()
    .trim()
    .label("Category")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),

  category_id: Joi.number()
    .integer()
    .positive()
    .label("Category ID")
    .messages({
      "number.base": COMMON_MESSAGES.NUMBER_BASE,
      "number.integer": COMMON_MESSAGES.NUMBER_INTEGER,
      "number.positive": COMMON_MESSAGES.NUMBER_POSITIVE
    }),

  size: Joi.string()
    .trim()
    .allow("", null)
    .label("Size")
    .messages({
      "string.base": COMMON_MESSAGES.STRING_BASE
    }),

  // ✅ JSONB ARRAY
  product_image: Joi.array()
    .items(
      Joi.object({
        file_path: Joi.string().uri().required().label("Product Image Path"),
        view: Joi.string().trim().required().label("Image View")
      })
    )
    .optional()
    .label("Product Images"),

  // ✅ JSONB OBJECT
  barcode_image: Joi.object({
    file_path: Joi.string().uri().required().label("Barcode Image Path")
  })
    .optional()
    .label("Barcode Image"),

  barcode: Joi.string()
    .optional()
    .label("Barcode"),

  product_code: Joi.string().trim().allow("", null).optional().label("Product Code"),
  mrp: Joi.number().allow(0, null).optional().label("MRP"),
  discounted_price: Joi.number().allow(0, null).optional().label("Discounted Price"),
  gst_percentage: Joi.number().allow(0, null).optional().label("GST Percentage"),
  cost_to_company: Joi.number().allow(0, null).optional().label("Cost to Company"),
  reorder_level: Joi.number().integer().min(0).optional().label("Reorder Level")
})
  .min(1); // ✅ at least one field required


module.exports = {
  productIdSchema,
  createProductSchema,
  updateProductSchema
};
