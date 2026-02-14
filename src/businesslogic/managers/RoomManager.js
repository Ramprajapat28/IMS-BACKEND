const RoomModel = require("../../models/RoomModel");
const ItemModel = require("../../models/ItemModel");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");

const {
  createRoomSchema,
  updateRoomSchema,
  roomIdSchema
} = require("../../validators/roomValidator");

class RoomManager {

  static async getAllRoomsPaginated(userId, page, limit) {
    try {
      const roomModel = new RoomModel(userId);
      const result = await roomModel.getAllRoomsPaginated(page, limit);

      const totalPages = Math.ceil(result.total / limit);
      const offset = (page - 1) * limit;

      return {
        rooms: result.data,
        total: result.total,
        page,
        limit,
        offset,
        totalPages,
        previous: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null
      };
    } catch (err) {
      throw new Error(`Failed to fetch rooms: ${err.message}`);
    }
  }

  static async getRoomById(id, userId) {
    const { error, value } = roomIdSchema.validate(
      { id },
      { abortEarly: false }
    );

    if (error) throw new JoiValidatorError(error);

    const roomModel = new RoomModel(userId);
    const room = await roomModel.getRoomById(value.id);

    if (!room) {
      return { success: false, message: "Room not found" };
    }

    return room;
  }

  static async createRoom(payload, userId) {
    const { error, value } = createRoomSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) throw new JoiValidatorError(error);

    const roomModel = new RoomModel(userId);

    try {
      const room = await roomModel.createRoom(value);
      return room;
    } catch (e) {
      // Logical errors about room already existing
      if (e.message.includes("Room exists")) {
        throw new JoiValidatorError({
          details: [
            { path: ["room_name"], message: e.message }
          ]
        });
      }

      // Unexpected database errors
      throw e;
    }
  }




  static async updateRoom(id, payload, userId) {
    const idCheck = roomIdSchema.validate({ id }, { abortEarly: false });
    if (idCheck.error) throw new JoiValidatorError(idCheck.error);

    const { error, value } = updateRoomSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) throw new JoiValidatorError(error);

    const roomModel = new RoomModel(userId);
    const room = await roomModel.updateRoom(id, value);

    if (!room) {
      return { success: false, message: "Room not found or no update data" };
    }

    return room;
  }

  static async deleteRoom(id, userId) {
    const { error, value } = roomIdSchema.validate(
      { id },
      { abortEarly: false }
    );

    if (error) throw new JoiValidatorError(error);

    const roomModel = new RoomModel(userId);
    const itemModel = new ItemModel(userId);

    // Check if room has active items
    const hasItems = await itemModel.hasActiveItems("room", value.id);
    if (hasItems) {
      throw new JoiValidatorError({
        details: [{
          path: ["room_id"],
          message: "Cannot delete room because it still contains products"
        }]
      });
    }

    const deleted = await roomModel.deleteRoom(value.id);

    if (!deleted) {
      return { success: false, message: "Room not found or already deleted" };
    }

    return true;
  }
}

module.exports = RoomManager;
