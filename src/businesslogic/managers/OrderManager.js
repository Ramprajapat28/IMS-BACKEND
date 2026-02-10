const OrderModel = require("../../models/OrderModel");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");
const { ORDER_STATUS } = require("../../models/libs/dbConstants");

const {
    createOrderSchema,
    updateStatusSchema,
    paginationSchema
} = require("../../validators/orderValidator");

class OrderManager {

    static async createOrder(product_id, shelf_id, quantity, status, userId = null) {
        const { error, value } = createOrderSchema.validate(
            { product_id, shelf_id, quantity, status },
            { abortEarly: false, stripUnknown: true }
        );

        if (error) throw new JoiValidatorError(error);

        try {
            const orderModel = new OrderModel(userId);

            const order = await orderModel.create({
                product_id: value.product_id,
                shelf_id: value.shelf_id,
                quantity: value.quantity,
                status: value.status || ORDER_STATUS.PROCESSING,
                created_by: userId
            });

            return order;

        } catch (error) {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    static async updateOrderStatus(order_id, status, userId = null) {
        const { error, value } = updateStatusSchema.validate(
            { order_id, status },
            { abortEarly: false, stripUnknown: true }
        );

        if (error) throw new JoiValidatorError(error);

        try {
            const orderModel = new OrderModel(userId);

            const existingOrder = await orderModel.findById(value.order_id);
            if (!existingOrder) {
                return null;
            }

            const updated = await orderModel.updateStatus(value.order_id, value.status);
            return updated;

        } catch (error) {
            throw new Error(`Failed to update order status: ${error.message}`);
        }
    }

    static async getOrderById(order_id, userId = null) {
        if (!order_id || isNaN(order_id)) {
            throw new Error("Invalid order ID");
        }

        try {
            const orderModel = new OrderModel(userId);
            const order = await orderModel.findById(parseInt(order_id));
            return order;
        } catch (error) {
            throw new Error(`Failed to fetch order: ${error.message}`);
        }
    }

    static async getOrdersPaginated(page, limit, filters = {}, userId = null) {
        const { error, value } = paginationSchema.validate(
            { page, limit, ...filters },
            { abortEarly: false, stripUnknown: true }
        );

        if (error) throw new JoiValidatorError(error);

        try {
            const orderModel = new OrderModel(userId);

            const result = await orderModel.findAllPaginated(
                {
                    product_id: value.product_id,
                    shelf_id: value.shelf_id,
                    status: value.status
                },
                value.page,
                value.limit
            );

            const totalPages = Math.ceil(result.total / value.limit);
            const offset = (value.page - 1) * value.limit;

            return {
                orders: result.data,
                total: result.total,
                page: value.page,
                limit: value.limit,
                totalPages,
                offset,
                previous: value.page > 1 ? value.page - 1 : null,
                next: value.page < totalPages ? value.page + 1 : null
            };

        } catch (error) {
            throw new Error(`Failed to fetch orders: ${error.message}`);
        }
    }
}

module.exports = OrderManager;
