const ProductModel = require("../../models/productModel");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");
const CategoryModel = require("../../models/CategoryModel");
const ItemModel = require("../../models/ItemModel");
const ProductCodeModel = require("../../models/ProductCodeModel");
const csv = require("csv-parser");
const axios = require("axios");
const { Readable } = require("stream");
const xlsx = require("xlsx");

const { generateAndUploadBarcode } = require("../../services/barcodeServices");
const {
  productIdSchema,
  createProductSchema,
  updateProductSchema
} = require("../../validators/productValidator");

const productModel = new ProductModel(); // no userId for now


class ProductManager {
  static async bulkImport(fileKey) {
    const results = [];
    const errors = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      // Determine file type from URL
      // Remove query params if any, then get extension
      const cleanUrl = fileKey.split('?')[0];
      const isExcel = cleanUrl.endsWith('.xlsx') || cleanUrl.endsWith('.xls');

      let rows = [];

      if (isExcel) {

        const response = await axios.get(fileKey, { responseType: "arraybuffer" });
        const workbook = xlsx.read(response.data, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); // Returns array of objects
      } else {
        // CSV Handling via Stream
        const response = await axios.get(fileKey, { responseType: "stream" });
        const stream = response.data.pipe(csv());
        for await (const row of stream) {
          rows.push(row);
        }
      }

      // Process Rows (Common Logic)
      for (const row of rows) {
        try {
          // Normalize Keys (lowercase, trim, remove BOM)
          const cleanRow = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.trim().replace(/^\uFEFF/, '').toLowerCase();
            cleanRow[cleanKey] = typeof row[k] === 'string' ? row[k].trim() : row[k];
          });

          // Map Columns to Product Data
          const productData = {
            name: cleanRow.name,
            sku: cleanRow.sku,
            category: cleanRow.category,
            description: cleanRow.description || "",
            size: cleanRow.size || "",
            product_code: cleanRow.product_code || "",
            product_image: cleanRow.image ? [{ file_path: cleanRow.image, view: "front" }] : []
          };

          // Reuse createProduct for validation & creation
          await ProductManager.createProduct(productData);
          successCount++;
          results.push({ sku: productData.sku, status: "success" });

        } catch (err) {
          failureCount++;

          // Extract detailed validation message if available
          let errorMessage = err.message || "Unknown error";
          if (err.name === "JoiValidatorError" && err.response && err.response.errors) {
            // Try to get the first validation detail
            const firstError = err.response.errors[0]?.body_error?.[0];
            if (firstError) {
              errorMessage = `${firstError.key}: ${firstError.message}`;
            }
          }

          errors.push({
            sku: row.sku || "UNKNOWN",
            error: errorMessage
          });
          results.push({ sku: row.sku, status: "failed", reason: errorMessage });
        }
      }

      return {
        success: true,
        summary: {
          total: successCount + failureCount,
          success: successCount,
          failed: failureCount
        },
        errors: errors
      };

    } catch (err) {
      throw new Error(`Bulk import failed: ${err.message}`);
    }
  }


  static async getAllProductsPaginated(page, limit) {
    try {
      const result = await productModel.findAllPaginated(page, limit);

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
      throw new Error(`Failed to fetch products: ${err.message}`);
    }
  }
  // static async getAllProductsPaginated(page, limit) {
  //   try {
  //     const result = await productModel.findAllPaginated(page, limit);

  //     // Fetch aggregated stock details for these products
  //     const products = result.data;
  //     const productIds = products.map(p => p.product_id);

  //     const itemModel = new ItemModel();
  //     const stockRows = await itemModel.findByProductIds(productIds);

  //     // Group items by product_id
  //     const stockMap = {};
  //     for (const row of stockRows) {
  //       if (!stockMap[row.product_id]) {
  //         stockMap[row.product_id] = [];
  //       }
  //       stockMap[row.product_id].push(row);
  //     }

  //     // Merge details
  //     const productsWithStock = products.map(product => ({
  //       ...product,
  //       stock_details: stockMap[product.product_id] || []
  //     }));

  //     const totalPages = Math.ceil(result.total / limit);
  //     const offset = (page - 1) * limit;

  //     return {
  //       products: productsWithStock,
  //       total: result.total,
  //       page,
  //       limit,
  //       offset,
  //       totalPages,
  //       previous: page > 1 ? page - 1 : null,
  //       next: page < totalPages ? page + 1 : null
  //     };
  //   } catch (err) {
  //     throw new Error(`Failed to fetch products: ${err.message}`);
  //   }
  // }


  static async getProductFullDetails(id) {
    const { error, value } = productIdSchema.validate(
      { id },
      { abortEarly: false }
    );
    if (error) throw new JoiValidatorError(error);
    try {
      const product = await productModel.findById(value.id);
      if (!product) return null;

      const itemModel = new ItemModel();
      // Fetch all items using the NEW method
      const items = await itemModel.getAllItemsByProductId(value.id);



      // Aggregate items by location (Warehouse -> Room -> Shelf OR Rack) and status
      const stockMap = new Map();

      items.forEach(item => {
        // Determine if item is in shelf or rack
        const isRackItem = item.rack_id && !item.shelf_id;

        // Handle location data gracefully
        let locationName, roomName, warehouseName, roomId, warehouseId;

        if (isRackItem) {
          // Item is in a rack
          locationName = item.rack_name || "Unassigned";
          // For racks, we need to get warehouse/room from rack relationships
          // The query already joins this data via rack_room_id and rack_warehouse_id
          roomId = item.rack_room_id;
          warehouseId = item.rack_warehouse_id;
          roomName = item.rack_room_name || "-";
          warehouseName = item.rack_warehouse_name || "-";
        } else {
          // Item is in a shelf (or unassigned)
          locationName = item.shelf_name || "Unassigned";
          roomName = item.room_name || "-";
          warehouseName = item.warehouse_name || "-";
          roomId = item.room_id;
          warehouseId = item.warehouse_id;
        }

        const status = item.status || "available";

        // Include rack_id in the key for proper grouping
        const key = `${warehouseId}|${roomId}|${item.shelf_id}|${item.rack_id}|${status}`;

        if (!stockMap.has(key)) {
          stockMap.set(key, {
            product_id: item.product_id,
            warehouse_id: warehouseId,
            room_id: roomId,
            shelf_id: item.shelf_id,
            rack_id: item.rack_id,
            warehouse_name: warehouseName,
            room_name: roomName,
            shelf_name: isRackItem ? item.rack_name : item.shelf_name,  // Use rack_name for rack items
            rack_name: item.rack_name,
            location_name: locationName,  // The display name (shelf or rack)
            is_rack: isRackItem,
            status: status,
            item_count: 0
          });
        }
        stockMap.get(key).item_count++;
      });

      const stockBreakdown = Array.from(stockMap.values());
      const totalQuantity = items.length;

      return {
        ...product,
        stock_quantity: totalQuantity, // Return actual count of items
        stock_details: stockBreakdown
      };
    } catch (err) {
      throw new Error(`Failed to get product full details: ${err.message}`);
    }
  }




  static async getProductById(id) {
    const { error, value } = productIdSchema.validate({ id }, { abortEarly: false });
    if (error) throw new JoiValidatorError(error);

    try {
      const product = await productModel.findById(value.id);
      if (!product) return null;

      // // Fetch aggregated stock details
      // const ItemModel = require("../../models/ItemModel");
      // const itemModel = new ItemModel();
      // const stockDetails = await itemModel.findByProductId(value.id);

      return {
        ...product,
        // stock_details: stockDetails || [] // Pass raw data to frontend
      };
    } catch (err) {
      throw new Error(`Failed to get product by ID: ${err.message}`);
    }
  }

  static async createProduct(productData) {
    const { error, value } = createProductSchema.validate(productData, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) throw new JoiValidatorError(error);

    try {
      const verifyProduct = await productModel.findBySkuId(value.sku);
      if (verifyProduct) {
        throw new JoiValidatorError({
          details: [{ path: ["sku"], message: "Product with this SKU already exists" }]
        });
      }

      const categoryModel = new CategoryModel(null);
      const category = await categoryModel.findByName(value.category);
      if (!category) {
        throw new JoiValidatorError({
          details: [
            { path: ["category"], message: "Invalid category selected" }
          ]
        });
      }

      // 3️⃣ Mutate value safely
      value.category_id = category.category_id;
      delete value.category;

      // Product Code Logic
      if (value.product_code) {
        const productCodeModel = new ProductCodeModel();
        let codeRecord = await productCodeModel.findByCode(value.product_code);
        if (!codeRecord) {
          codeRecord = await productCodeModel.create({
            code: value.product_code,
            name: value.name // Use product name as default for code group name
          });
        }
        value.product_code_id = codeRecord.id;
      }

      // Always remove product_code from the insert object (since it's not a column)
      if ('product_code' in value) delete value.product_code;
      // barcode
      value.barcode = value.sku;



      // barcode image
      const barcodeResult = await generateAndUploadBarcode(value.sku);
      value.barcode_image = JSON.stringify({
        file_path: barcodeResult.cdnUrl
      });

      // product images
      if (!Array.isArray(value.product_image)) {
        value.product_image = [];
      }
      value.product_image = JSON.stringify(value.product_image);

      const product = await productModel.create(value);
      return product;


    } catch (err) {
      throw err;
    }
  }

  static async updateProduct(id, data) {
    const idCheck = productIdSchema.validate({ id }, { abortEarly: false });
    if (idCheck.error) throw new JoiValidatorError(idCheck.error);

    const { error, value } = updateProductSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) throw new JoiValidatorError(error);

    try {
      const verifyProduct = await productModel.findById(id);
      if (!verifyProduct) return null;


      if (value.product_code) {
        const productCodeModel = new ProductCodeModel();
        let codeRecord = await productCodeModel.findByCode(value.product_code);
        if (!codeRecord) {
          codeRecord = await productCodeModel.create({
            code: value.product_code,
            name: value.name || verifyProduct.name
          });
        }
        value.product_code_id = codeRecord.id;
        delete value.product_code;
      }

      // Check if SKU is being updated
      if (value.sku && value.sku !== verifyProduct.sku) {
        // 1. Update text barcode
        value.barcode = value.sku;

        // 2. Generate new barcode image
        const barcodeResult = await generateAndUploadBarcode(value.sku);
        value.barcode_image = {
          file_path: barcodeResult.cdnUrl
        };

      }

      // ✅ Normalize product_image for JSONB array
      if (value.product_image) {
        value.product_image = JSON.stringify(value.product_image);
      }

      if (value.barcode_image) {
        value.barcode_image = JSON.stringify(value.barcode_image);
      }

      // Cleanup non-column fields
      if ('product_code' in value) delete value.product_code;
      if ('category_name' in value) delete value.category_name;


      const product = await productModel.update(id, value);
      return product || null;
    } catch (err) {
      throw new Error(`Failed to update product: ${err.message}`);
    }
  }

  static async deleteProduct(id) {
    const { error, value } = productIdSchema.validate({ id }, { abortEarly: false });
    if (error) throw new JoiValidatorError(error);

    try {
      const product = await productModel.softDelete(value.id);
      return product || null;
    } catch (err) {
      throw new Error(`Failed to delete product: ${err.message}`);
    }
  }

  static async findBysku(sku) {
    if (!sku) {
      throw new JoiValidatorError({
        details: [{ path: ["sku"], message: "SKU is required" }]
      });
    }

    try {
      return await productModel.findBySkuId(sku);
    } catch (err) {
      throw new Error(`Failed to find product by SKU: ${err.message}`);
    }
  }

  static async generateBarcode(barcode) {
    if (!barcode) {
      throw new JoiValidatorError({
        details: [{ path: ["barcode"], message: "Barcode is required" }]
      });
    }

    try {
      return await productModel.generateBarcode(barcode);
    } catch (err) {
      throw new DatabaseError(`Failed to find product by barcode: ${err.message}`);
    }
  }

  static async getProductsByCategoryWithStock(categoryName, page = 1, limit = 10) {
    try {
      const categoryModel = new CategoryModel(null);
      const category = await categoryModel.findByName(categoryName);
      if (!category) {
        throw new JoiValidatorError({
          details: [{ path: ["category"], message: "Invalid category" }]
        });
      }

      // Use the new Grouped Inventory Method
      const result = await productModel.findCategoryInventory(
        category.category_id,
        page,
        limit
      );

      // Collect IDs for valid standalone products to fetch detailed location
      // AND for "Groups" with only 1 variant (treat as single product)
      const productIdsToFetch = [];
      result.data.forEach(p => {
        if (p.type === 'product') {
          productIdsToFetch.push(p.id);
        } else if (p.type === 'group' && p.variant_count === 1) {
          // Flattening: fetch location for the single item inside the group
          productIdsToFetch.push(p.single_id);
        }
      });

      let locationMap = {};

      if (productIdsToFetch.length > 0) {
        const itemModel = new ItemModel();
        const items = await itemModel.findByProductIds(productIdsToFetch);

        items.forEach(item => {
          if (!locationMap[item.product_id]) {
            locationMap[item.product_id] = new Set();
          }
          // Handle both shelf and rack items
          const locName = item.rack_id && !item.shelf_id
            ? (item.rack_name || '?')  // Rack item
            : (item.shelf_name || '?'); // Shelf item
          const loc = `${item.room_name || '?'}-${locName}`;
          locationMap[item.product_id].add(loc);
        });
      }

      const mappedProducts = result.data.map(p => {
        // Flatten Single-Variant Groups
        let finalType = p.type;
        let finalId = p.id;
        let finalSku = p.sku;

        if (p.type === 'group' && p.variant_count === 1) {
          finalType = 'product';
          finalId = p.single_id;
          finalSku = p.single_sku;
        }

        let location = "See Details";

        if (finalType === 'group') {
          location = `Mixed (${p.variant_count} variants)`;
          // finalSku = "-----"; // Removed for navigation support
        } else {
          // It's a product (either originally or converted)
          const locs = locationMap[finalId];
          if (!locs || locs.size === 0) {
            location = p.stock_quantity > 0 ? "Unassigned" : "-";
          } else if (locs.size === 1) {
            location = Array.from(locs)[0];
          } else {
            location = Array.from(locs).join(", ");
          }
        }

        return {
          product_id: finalId,
          name: p.name,
          sku: finalSku, // Will be the single variant SKU if flattened
          category_name: p.category_name,
          stock_quantity: p.stock_quantity,
          type: finalType,
          variant_count: p.variant_count,
          product_image: p.product_image,
          location: location,
          stock_details: []
        };
      });

      const totalPages = Math.ceil(result.total / limit);
      const offset = (page - 1) * limit;

      return {
        products: mappedProducts,
        total: result.total,
        page,
        limit,
        offset,
        totalPages,
        previous: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null
      };
    } catch (err) {
      throw new Error(`Failed to fetch category products with stock: ${err.message}`);
    }
  }

  static async getProductsByCode(code) {
    if (!code) {
      throw new JoiValidatorError({
        details: [{ path: ["code"], message: "Product Code is required" }]
      });
    }

    try {
      const productCodeModel = new ProductCodeModel();
      const codeRecord = await productCodeModel.findByCode(code);

      if (!codeRecord) {
        // Return empty list if code doesn't exist
        return [];
      }

      const products = await productModel.findByCodeIdWithStock(codeRecord.id);

      // --- Collect IDs to fetch location details ---
      const productIds = products.map(p => p.product_id);
      let locationMap = {};

      if (productIds.length > 0) {
        const itemModel = new ItemModel();
        const items = await itemModel.findByProductIds(productIds);

        items.forEach(item => {
          if (!locationMap[item.product_id]) {
            locationMap[item.product_id] = new Set();
          }
          // Handle both shelf and rack items
          const locName = item.rack_id && !item.shelf_id
            ? (item.rack_name || '?')  // Rack item
            : (item.shelf_name || '?'); // Shelf item
          const loc = `${item.room_name || '?'}-${locName}`;
          locationMap[item.product_id].add(loc);
        });
      }

      // --- Map locations to products ---
      return products.map(p => {
        const locs = locationMap[p.product_id];
        let location = "See Details";

        if (!locs || locs.size === 0) {
          location = p.stock_quantity > 0 ? "Unassigned" : "-";
        } else if (locs.size === 1) {
          location = Array.from(locs)[0];
        } else {
          location = Array.from(locs).join(", ");
        }

        return {
          ...p,
          location: location,
          stock_quantity: Number(p.stock_quantity || 0)
        };
      });

    } catch (err) {
      throw new Error(`Failed to fetch products by code: ${err.message}`);
    }
  }

  static async searchProductCodes(query) {
    try {
      if (!query || query.length < 2) return []; // Minimum chars for search

      const productCodeModel = new ProductCodeModel();
      const codes = await productCodeModel.searchCodes(query);
      return codes;
    } catch (err) {
      // Return empty array instead of throwing to avoid blocking UI
      console.error("Search codes error:", err);
      return [];
    }
  }
}

module.exports = ProductManager;
