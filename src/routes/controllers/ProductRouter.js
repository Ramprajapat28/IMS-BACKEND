const express = require("express");
const router = express.Router({ mergeParams: true });

const ProductManager = require("../../businesslogic/managers/ProductManager");
const { generatePresignedUploadUrl } = require("../../services/presignedUploadServices");
const { generateBarcodeBuffer } = require("../../utils/barcodeGenerator");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
// const  {ACCESS_ROLES}  = require("../../businesslogic/accessmanagement/roleConstants");

// const validators = require("../../validators/product.validator");
// const validate = require("../../middleware/validation.middleware");

// 
// GET ALL PRODUCTS
// 
router.get(
  "/all",
  appWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || "";
    const result = await ProductManager.getAllProductsPaginated(page, limit, search);
    if (!result.products || result.products.length === 0) {
      // return res.status(404).json({
      //   success: false,
      //   message: "No products found",
      // });
      // Return 200 with empty list
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: page,
          limit: limit,
          totalPages: 0,
          previous: null,
          next: null,
        },
      });
    }
    return res.json({
      success: true,
      data: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        previous: result.previous,
        next: result.next,
      },
    });
  }, [ACCESS_ROLES.ALL])
);

// 
// CREATE PRODUCT
// 
router.post(
  "/create",
  appWrapper(async (req, res) => {
    const productData = req.body;

    // Handle Image Upload
    // if (req.files && req.files.image) {
    //   const { uploadToS3 } = require("../../services/s3Services");
    //   const file = req.files.image;

    //   const fileName = `products/${productData.sku}-${Date.now()}.png`;
    //   const imageUrl = await uploadToS3(file.data, fileName, file.mimetype);

    //   productData.product_image = imageUrl;
    // }
    // 1️⃣ Handle multiple product images (frontend sends array via presigned URL)
    if (req.body.product_images && Array.isArray(req.body.product_images)) {
      productData.product_image = req.body.product_images.map(img => ({
        file_path: img.file_path,
        view: img.view || "front" // optional: front/back/etc
      }));
    }

    // 2️⃣ Handle barcode image (backend uploads to S3)
    if (req.files && req.files.barcode) {
      const file = req.files.barcode;
      const fileName = `barcode/${productData.sku}-${Date.now()}.png`;
      const barcodeUrl = await uploadToS3(file.data, fileName, file.mimetype);

      productData.barcode_image = { file_path: barcodeUrl };
    }

    // 3️⃣ Create product
    const product = await ProductManager.createProduct(productData, res.locals.userInfo?.user?.user_id);

    return res.json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  }, [ACCESS_ROLES.ALL])
);


// 
// BULK IMPORT PRODUCTS
// 
router.post(
  "/import",
  appWrapper(async (req, res) => {
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({ success: false, message: "No file path provided" });
    }

    const result = await ProductManager.bulkImport(file_path, res.locals.userInfo?.user?.user_id);

    return res.json({
      success: true,
      data: result,
      message: `Import processed: ${result.summary.success} success, ${result.summary.failed} failed.`
    });
  }, [ACCESS_ROLES.ALL])
);


//
// GET PRODUCT BY ID
// 
router.get(
  "/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;

    const product = await ProductManager.getProductById(id, res.locals.userInfo?.user?.user_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  }, [ACCESS_ROLES.ALL])
);

// 
// UPDATE PRODUCT
// 
router.put(
  "/update/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // 1️⃣ Update multiple product images if provided
    if (req.body.product_images && Array.isArray(req.body.product_images)) {
      updateData.product_image = req.body.product_images.map(img => ({
        file_path: img.file_path,
        view: img.view || "front"
      }));
    }

    // 2️⃣ Update barcode image if a new file is uploaded
    if (req.files && req.files.barcode) {
      const file = req.files.barcode;
      const fileName = `barcode/${updateData.sku || "unknown"}-${Date.now()}.png`;
      const barcodeUrl = await uploadToS3(file.data, fileName, file.mimetype);

      updateData.barcode_image = { file_path: barcodeUrl };
    }

    // 3️⃣ Update product
    const updatedProduct = await ProductManager.updateProduct(id, updateData, res.locals.userInfo?.user?.user_id);

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  }, [ACCESS_ROLES.ALL])
);


// 
// DELETE PRODUCT
// 
router.post(
  "/delete/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;

    const result = await ProductManager.deleteProduct(id, res.locals.userInfo?.user?.user_id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already deleted",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  }, [ACCESS_ROLES.ALL])
);


router.get(
  "/sku/:sku",
  appWrapper(async (req, res) => {
    const { sku } = req.params;

    const product = await ProductManager.findBysku(sku, res.locals.userInfo?.user?.user_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  }, [ACCESS_ROLES.ALL])
);


// ==========================
// PRESIGNED URL FOR UPLOAD
// ==========================
router.post(
  "/presigned-url",
  appWrapper(async (req, res) => {
    const { fileName, functionality, subFunctionality } = req.body;
    const result = await generatePresignedUploadUrl({ fileName, functionality, subFunctionality });
    res.json(result);
  }, [ACCESS_ROLES.ALL])
);


// generate BARCODE BY barcode id
router.get(
  "/barcode/:barcode",
  appWrapper(async (req, res) => {
    const { barcode } = req.params;

    // ensure product exists
    const product = await ProductManager.generateBarcode(barcode);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // generate barcode image
    const png = await generateBarcodeBuffer(product.sku);

    res.set("Content-Type", "image/png");
    res.send(png);
    // return res.json({
    //   success: true,
    //   data: product,
    // });
  })
);

// Get product full details (including stock breakdown)
router.get(
  "/productDetails/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;

    const product = await ProductManager.getProductFullDetails(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  }, [ACCESS_ROLES.ALL])
);




// Get category products with stock quantities
router.get(
  "/category/:categoryName/with-stock",
  appWrapper(async (req, res) => {
    const { categoryName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const result = await ProductManager.getProductsByCategoryWithStock(
      categoryName,
      page,
      limit,
      search
    );

    if (!result.products || result.products.length === 0) {
      // return res.status(404).json({
      //   success: false,
      //   message: `No products found for category: ${categoryName}`,
      // });
      return res.json({
        success: true,
        data: {
          products: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          previous: null,
          next: null
        },
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  }, [ACCESS_ROLES.ALL])
);

// Get products by Code (Variant Group)
router.get(
  "/code/:code",
  appWrapper(async (req, res) => {
    const { code } = req.params;

    const products = await ProductManager.getProductsByCode(code);

    // Always return success200, but data might be empty array
    return res.json({
      success: true,
      data: products,
    });
  }, [ACCESS_ROLES.ALL])
);



// Search for product codes (autocomplete)
router.get(
  "/codes/search",
  appWrapper(async (req, res) => {
    const { query } = req.query; // ?query=sum
    const codes = await ProductManager.searchProductCodes(query);

    return res.json({
      success: true,
      data: codes,
    });
  }, [ACCESS_ROLES.ALL])
);

// Get aggregated stock logs for a product
router.get(
  "/stock-logs/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await ProductManager.getStockLogsAggregated(id, page, limit);

    return res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  }, [ACCESS_ROLES.ALL])
);

module.exports = router;
