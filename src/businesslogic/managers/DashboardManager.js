const db = require('../../models/libs/Db');
const ProductModel = require("../../models/productModel");
const OrderModel = require("../../models/OrderModel")
const ItemModel = require("../../models/ItemModel")
const CategoryModel = require("../../models/CategoryModel")

class DashboardManager {

  static async getTopSellingProducts(limit = 10) {
    const qb = db.getQueryBuilder();

    return await qb('orders as o')
      .join('products as p', 'p.product_id', 'o.product_id') //  NO p.id
      .where('o.status', 'sold')
      .select(
        'p.product_id as product_id', //  correct PK
        'p.name',
        'p.product_image'
      )
      .sum('o.quantity as total_sold')
      .groupBy(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .orderBy('total_sold', 'desc')
      .limit(limit);
  }

  static async getLeastSellingProducts(limit = 10) {
    const qb = db.getQueryBuilder();

    return await qb('orders as o')
      .join('products as p', 'p.product_id', 'o.product_id') // 
      .where('o.status', 'sold')
      .select(
        'p.product_id as product_id',
        'p.name',
        'p.product_image'
      )
      .sum('o.quantity as total_sold')
      .groupBy(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .orderBy('total_sold', 'asc')
      .limit(limit);
  }

  static async totalProducts() {
    const productModel = new ProductModel();
    const totalProducts = await productModel.countTotalProducts();

    return {
      totalProducts
    };
  }

  static async totalOrder() {
    const orderModel = new OrderModel();
    const totalOrder = await orderModel.totalOrder();

    return {
      totalOrder
    };

  }


  // static async getDetailOfLowAndOutOfStock(lowStockLimit = 5) {
  //   const itemModel = new ItemModel();

  //   const groupedItems = await itemModel.countAvailableItemsByProduct();

  //   return groupedItems.map(item => {
  //     const count = Number(item.available_count);

  //     let stock_status = "in_stock";
  //     if (count === 0) stock_status = "out_of_stock";
  //     else if (count <= lowStockLimit) stock_status = "low_stock";

  //     return {
  //       product_id: item.product_id,
  //       product_name: item.name,
  //       available_count: count,
  //       stock_status
  //     };
  //   }).filter(item => item.stock_status !== "in_stock");
  // }
  // static async getLowAndOutOfStockCount(lowStockLimit = 5) {
  //   const itemModel = new ItemModel();

  //   const groupedItems = await itemModel.countAvailableItemsByProduct();

  //   let lowStockCount = 0;
  //   let outOfStockCount = 0;

  //   for (const item of groupedItems) {
  //     const count = Number(item.available_count);

  //     if (count === 0) {
  //       outOfStockCount++;
  //     } else if (count <= lowStockLimit) {
  //       lowStockCount++;
  //     }
  //   }

  //   return {
  //     low_stock_products: lowStockCount,
  //     out_of_stock_products: outOfStockCount
  //   };
  // }
  static async getDetailOfLowAndOutOfStock(lowStockLimit = 10) {
    const itemModel = new ItemModel();

    const groupedItems = await itemModel.countAvailableItemsByProduct();

    let lowStockCount = 0;
    let outOfStockCount = 0;

    const products = groupedItems
      .map(item => {
        const count = Number(item.available_count);
        const reorderLevel = Number(item.reorder_level || 10);

        let stock_status = "in_stock";

        if (count === 0) {
          stock_status = "out_of_stock";
          outOfStockCount++;
        } else if (count <= reorderLevel) {
          stock_status = "low_stock";
          lowStockCount++;
        }

        return {
          product_id: item.product_id,
          product_name: item.name,
          available_count: count,
          reorder_level: reorderLevel,
          stock_status
        };
      })
      .filter(item => item.stock_status !== "in_stock");

    return {
      stock_status: {
        low_stock_products: lowStockCount,
        out_of_stock_products: outOfStockCount
      },
      products
    };
  }

  static async getProductCountByCategory() {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.countProductsByCategory();

    // Normalize PostgreSQL count (string → number)
    return data.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      total_products: Number(row.total_products)
    }));
  }

}

module.exports = DashboardManager;
