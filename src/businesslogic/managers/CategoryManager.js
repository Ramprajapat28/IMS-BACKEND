const JoiValidatorError = require("../../errorhandlers/JoiValidationError");
const CategoryModel = require("../../models/CategoryModel");
const ProductModel = require("../../models/productModel");
const validationError = require("../../errorhandlers/ValidationError");
const { createCategorySchema, createGlobalCategorySchema, categoryIdSchema } = require("../../validators/categoryValidator");


class CategoryManager {


  static async getProductsByCategoryPaginated(categoryName, userId, page, limit) {
    try {
      // 1️⃣ Validate category
      const categoryModel = new CategoryModel(userId);
      const category = await categoryModel.findByName(categoryName);
      if (!category) {
        throw new validationError("Invalid category");
      }

      // 2️⃣ Product model instance
      const productModel = new ProductModel(userId);

      // 3️⃣ Fetch paginated data (same as reference)
      const result = await productModel.findByCategoryIdPaginated(
        category.category_id,
        page,
        limit
      );

      console.log("Paginated products for category:", categoryName, result);
      const totalPages = Math.ceil(result.total / limit);
      const offset = (page - 1) * limit;

      return {
        products: result.data,
        total: result.total,
        page,
        limit,
        offset,
        totalPages,
        previous: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null
      };
    } catch (err) {
      throw new Error(`Failed to fetch category products: ${err.message}`);
    }
  }

  static async createGlobalCategory(payload) {
    const { error, value } = createGlobalCategorySchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true

    })
    if (error) {
      throw new JoiValidatorError(error);

    }
    const categoryModel = new CategoryModel(null);
    const existingCategory = await categoryModel.findGlobalByName(value.category_name);

    if (existingCategory) {
      throw new validationError("Global Category with this name already exists");

    }
    return categoryModel.createGlobal(
      {
        category_name: value.category_name,
        logo_url: value.logo_url || null
      },

    );
  }

  static async updateGlobalCategory(globalCategoryId, payload) {
    // Simple implementation for now, could use full validation if needed
    const categoryModel = new CategoryModel(null);
    return categoryModel.updateGlobal(globalCategoryId, {
      category_name: payload.category_name,
      logo_url: payload.logo_url
    });
  }

  static async findAllGlobalCategories() {

    const categoryModel = new CategoryModel(null);
    return categoryModel.findAllGlobal();
  }

  static async findAllCategories() {
    const categoryModel = new CategoryModel(null);
    return categoryModel.findAll();
  }

  static async createCategory(payload) {
    const { error, value } = createCategorySchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new JoiValidatorError(error);
    }

    // 1️⃣ Check if global category exists
    console.log("Validated payload value:", value);
    console.log("global_category_id:", value.global_category_id);
    const categoryModel = new CategoryModel(null);
    const globalCategory =
      await categoryModel.findGlobalById(value.global_category_id);

    if (!globalCategory) {
      throw new ValidationError("Global category does not exist");
    }

    // 2️⃣ Check duplicate category under same global category
    const existingCategory =
      await categoryModel.findByNameAndGlobal(
        value.category_name,
        value.global_category_id
      );

    if (existingCategory) {
      throw new ValidationError(
        "Category with this name already exists under this global category"
      );
    }

    // 3️⃣ Create sub-category
    return categoryModel.create({
      category_name: value.category_name,
      global_category_id: value.global_category_id,
      logo_url: value.logo_url || null,
      sizes: JSON.stringify(value.sizes || [])
    });
  }

  static async updateCategory(categoryId, payload) {
    const { error, value } = createCategorySchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new JoiValidatorError(error);
    }

    const categoryModel = new CategoryModel(null);
    return categoryModel.update(categoryId, {
      category_name: value.category_name,
      global_category_id: value.global_category_id,
      logo_url: value.logo_url,
      sizes: JSON.stringify(value.sizes || [])
    });
  }
  static async getGlobalCategoryById(categoryId) {

    const { error, value } = categoryIdSchema.validate({ category_id: categoryId }, {
      abortEarly: false,
      stripUnknown: true
    })
    if (error) {
      throw new JoiValidatorError(error);

    }
    const categoryModel = new CategoryModel(null);
    const category = await categoryModel.findGlobalById(categoryId);
    if (!category) {
      throw new Error("Global Category not found");
    }

    return category;
  }
  static async deleteGlobalCategoryById(globalCategoryId) {

    const { error, value } = categoryIdSchema.validate({ category_id: globalCategoryId }, {
      abortEarly: false,
      stripUnknown: true
    })
    if (error) {
      throw new JoiValidatorError(error);

    }
    // 1️⃣ Check global category exists
    const categoryModel = new CategoryModel(null);
    const globalCategory = await categoryModel.findGlobalById(globalCategoryId);

    if (!globalCategory) {
      throw new validationError("Global Category not found");
    }

    // 2️⃣ Check if sub-categories exist
    const subCategoryCount = await categoryModel.countByGlobalCategoryId(globalCategoryId);
    console.log(`[deleteGlobalCategory] global_category_id=${globalCategoryId}, subCategoryCount=${subCategoryCount}`);

    if (subCategoryCount > 0) {
      throw new validationError("Global Category cannot be deleted because sub-categories exist");
    }

    // 3️⃣ Soft delete
    await categoryModel.globalCategoryDelete(globalCategoryId);

    return {
      global_category_id: globalCategoryId,
      deleted: true,
      message: "Global Category deleted successfully"
    };
  }


  static async deleteCategoryById(categoryId, userId) {
    const { error, value } = categoryIdSchema.validate({ category_id: categoryId }, {
      abortEarly: false,
      stripUnknown: true
    })
    if (error) {
      throw new JoiValidatorError(error);

    }
    // 1️⃣ Check category exists
    const categoryModel = new CategoryModel(userId);
    const category = await categoryModel.findById(categoryId);

    if (!category || category.is_deleted) {
      throw new validationError("Category not found");
    }

    // 2️⃣ Check if products exist (query directly)
    const qb = await categoryModel.getQueryBuilder();
    const result = await qb('products')
      .where({ category_id: categoryId, is_deleted: false })
      .count('product_id as count')
      .first();
    const productCount = parseInt(result.count);
    console.log(`[deleteCategory] category_id=${categoryId}, productCount=${productCount}`);

    if (productCount > 0) {
      throw new validationError("Category cannot be deleted because products exist");
    }

    // 3️⃣ Soft delete
    await categoryModel.categoryDelete(categoryId);

    return {
      category_id: categoryId,
      deleted: true,
      message: "Category deleted successfully"
    };
  }



  static async getCategoryListWithCounts() {
    try {
      const categoryModel = new CategoryModel(null);
      return await categoryModel.countProductsByCategory();
    } catch (err) {
      throw new Error(`Failed to fetch category list with counts: ${err.message}`);
    }
  }

}


module.exports = CategoryManager;