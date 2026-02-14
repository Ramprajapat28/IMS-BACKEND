const CategoryManager = require("../../businesslogic/managers/CategoryManager");
const express = require("express");
const router = express.Router({ mergeParams: true });
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
const CategoryModel = require("../../models/CategoryModel");
const { generatePresignedUploadUrl } = require("../../services/presignedUploadServices");


router.post("/createGlobal",

  appWrapper(async (req, res) => {
    const globalCategory = await CategoryManager.createGlobalCategory(req.body, res.locals.userInfo?.user?.user_id);

    return {
      success: true,
      data: globalCategory,
      message: "Global Category created successfully"
    };

  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

router.get('/list_global',
  appWrapper(async (req, res) => {
    const globalCategories = await CategoryManager.findAllGlobalCategories();

    if (!globalCategories || globalCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No global categories found"
      });
    }

    return {
      success: true,
      data: globalCategories
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

router.post('/delete_global/:id',
  appWrapper(async (req, res) => {

    const globalCategoryId = Number(req.params.id);

    const result = await CategoryManager.deleteGlobalCategoryById(
      globalCategoryId
    );

    return {
      success: true,
      data: result
    };

  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN]
  ))

router.put('/update_global/:id',
  appWrapper(async (req, res) => {
    const globalCategoryId = Number(req.params.id);
    const globalCategory = await CategoryManager.updateGlobalCategory(globalCategoryId, req.body, res.locals.userInfo?.user?.user_id);

    return {
      success: true,
      data: globalCategory,
      message: "Global Category updated successfully"
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

router.get('/list',
  appWrapper(async (req, res) => {
    const categories = await CategoryManager.findAllCategories();

    return {
      success: true,
      data: categories
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

router.post("/create",
  appWrapper(async (req, res) => {
    const category = await CategoryManager.createCategory(req.body, res.locals.userInfo?.user?.user_id);


    return {
      success: true,
      data: category,
      message: "Category created successfully"
    };

  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN]
  )
)

router.put('/update/:id',
  appWrapper(async (req, res) => {
    const categoryId = Number(req.params.id);
    const category = await CategoryManager.updateCategory(categoryId, req.body, res.locals.userInfo?.user?.user_id);

    return {
      success: true,
      data: category,
      message: "Category updated successfully"
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

router.post(
  "/delete/:id",
  appWrapper(async (req, res) => {
    try {
      const categoryId = Number(req.params.id);

      const result = await CategoryManager.deleteCategoryById(
        categoryId,
        res.locals.userInfo?.user?.user_id
      );

      return {
        success: true,
        data: result
      };

    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }, [ACCESS_ROLES.ALL])
);



router.get(
  "/category_name/:categoryName",
  appWrapper(async (req, res) => {
    const { categoryName } = req.params;

    const products = await CategoryManager.getProductsByCategoryPaginated(
      categoryName,
      res.locals.userInfo?.user?.user_id,
      req.query.page,
      req.query.limit
    );

    if (!products || products.products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No products found for category: ${categoryName}`,
      });
    }

    return {
      success: true,
      data: products,
    };
  }, [ACCESS_ROLES.ALL])
);

router.get(
  "/global_category/:categoryId",
  appWrapper(async (req, res) => {
    const categoryId = Number(req.params.categoryId);

    const category = await CategoryManager.getGlobalCategoryById(categoryId);

    return {
      success: true,
      data: category
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

router.get(
  "/list",
  appWrapper(async (req, res) => {
    const categories = await CategoryManager.findAllCategories();

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found"
      });
    }

    return {
      success: true,
      data: categories
    };
  }, [ACCESS_ROLES.ALL])
);






router.post(
  "/list-with-counts",
  appWrapper(async (req, res) => {
    const categories = await CategoryManager.getCategoryListWithCounts();

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    return {
      success: true,
      data: categories,
    };
  }, [ACCESS_ROLES.ALL])
);


router.post(
  "/presigned-url",
  appWrapper(async (req, res) => {
    const { fileName, functionality, subFunctionality } = req.body;
    const result = await generatePresignedUploadUrl({ fileName, functionality, subFunctionality });
    res.json(result);
  }, [ACCESS_ROLES.ALL])
);

module.exports = router;