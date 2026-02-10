const RackModel = require("../../models/RackModel");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");
const validationError = require("../../errorhandlers/ValidationError");
const Joi = require("joi");

// Validation schemas
const createRackSchema = Joi.object({
    rack_name: Joi.string().trim().min(1).max(255).required().label("Rack Name"),
    warehouse_id: Joi.number().integer().positive().required().label("Warehouse ID"),
    room_id: Joi.number().integer().positive().required().label("Room ID"),
    capacity: Joi.number().integer().positive().optional().label("Capacity")
});

const updateRackSchema = Joi.object({
    rack_name: Joi.string().trim().min(1).max(255).optional().label("Rack Name"),
    warehouse_id: Joi.number().integer().positive().optional().label("Warehouse ID"),
    room_id: Joi.number().integer().positive().optional().label("Room ID"),
    capacity: Joi.number().integer().positive().optional().label("Capacity")
}).min(1);

const rackIdSchema = Joi.object({
    rack_id: Joi.number().integer().positive().required().label("Rack ID")
});

class RackManager {
    static async getAllRacks(filters = {}, page = 1, limit = 10, userId = null) {
        try {
            const rackModel = new RackModel(userId);
            return await rackModel.getAllRackPaginated(filters, page, limit);
        } catch (err) {
            throw new Error(`Failed to fetch racks: ${err.message}`);
        }
    }

    static async getRackById(rackId, userId = null) {
        const { error, value } = rackIdSchema.validate({ rack_id: rackId });
        if (error) throw new JoiValidatorError(error);

        try {
            const rackModel = new RackModel(userId);
            const rack = await rackModel.getRackById(value.rack_id);

            if (!rack) {
                throw new validationError("Rack not found");
            }

            return rack;
        } catch (err) {
            throw err;
        }
    }

    static async createRack(payload, userId = null) {
        const { error, value } = createRackSchema.validate(payload, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) throw new JoiValidatorError(error);

        try {
            const rackModel = new RackModel(userId);
            return await rackModel.createRack(value);
        } catch (err) {
            throw new Error(`Failed to create rack: ${err.message}`);
        }
    }

    static async updateRack(rackId, payload, userId = null) {
        const idCheck = rackIdSchema.validate({ rack_id: rackId });
        if (idCheck.error) throw new JoiValidatorError(idCheck.error);

        const { error, value } = updateRackSchema.validate(payload, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) throw new JoiValidatorError(error);

        try {
            const rackModel = new RackModel(userId);
            const rack = await rackModel.updateRack(rackId, value);

            if (!rack) {
                throw new validationError("Rack not found");
            }

            return rack;
        } catch (err) {
            throw err;
        }
    }

    static async deleteRack(rackId, userId = null) {
        const { error, value } = rackIdSchema.validate({ rack_id: rackId });
        if (error) throw new JoiValidatorError(error);

        try {
            const rackModel = new RackModel(userId);
            const rack = await rackModel.deleteRack(value.rack_id);

            if (!rack) {
                throw new validationError("Rack not found");
            }

            return {
                rack_id: value.rack_id,
                deleted: true,
                message: "Rack deleted successfully"
            };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = RackManager;
