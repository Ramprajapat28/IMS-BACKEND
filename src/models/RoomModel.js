const BaseModel = require("../models/libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");
const { TABLE_DEFAULTS } = require("../models/libs/dbConstants");
const { json } = require("express");

class RoomModel extends BaseModel {
  constructor(userId) {
    super(userId);
  }

  // Basic columns for INSERT/UPDATE operations (no joins)
  getBasicColumns() {
    return ["room_id", "room_name", "warehouse_id"];
  }

  // Columns for SELECT with joins
  getPublicColumns() {
    return ["room_id", "room_name", "rooms.warehouse_id", "warehouses.name as warehouse_name"];
  }

  async getAllRoomsPaginated(page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const data = await qb("rooms")
        .select(this.getPublicColumns())
        .leftJoin("warehouses", "rooms.warehouse_id", "warehouses.warehouse_id")
        .where("rooms.is_deleted", false)
        .orderBy("room_id", "asc")
        .limit(limit)
        .offset(offset);

      const [{ count }] = await qb("rooms")
        .where("rooms.is_deleted", false)
        .count("* as count");

      return {
        data,
        total: Number(count)
      };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }


  async getRoomById(room_id) {
    try {
      const qb = await this.getQueryBuilder();
      return qb("rooms")
        .select(this.getPublicColumns())
        .leftJoin("warehouses", "rooms.warehouse_id", "warehouses.warehouse_id")
        .where("rooms.is_deleted", false)
        .where("rooms.room_id", room_id)
        .first() || null;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async createRoom(roomData) {
    const qb = await this.getQueryBuilder();

    const existingRoom = await qb("rooms")
      .where({
        room_name: roomData.room_name,
        warehouse_id: roomData.warehouse_id
      })
      .first();

    if (existingRoom && existingRoom.is_deleted) {
      throw new Error("Room exists but is deleted");
    }

    if (existingRoom && !existingRoom.is_deleted) {
      return json({ message: "Room already exists in this warehouse" });
    }

    const insertData = this.insertStatement({
      room_name: roomData.room_name,
      warehouse_id: roomData.warehouse_id
    });

    const [room] = await qb("rooms")
      .insert(insertData)
      .returning(this.getBasicColumns());

    return room;
  }



  async updateRoom(room_id, roomData) {
    try {
      const qb = await this.getQueryBuilder();
      const updateData = await this.updateStatement(roomData);

      const [room] = await qb("rooms")
        .where({ room_id })
        .update(updateData)
        .returning(this.getBasicColumns());

      return room || null;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async deleteRoom(room_id) {
    try {
      const qb = await this.getQueryBuilder();

      const room = await qb("rooms").where({ room_id }).first();
      if (!room || room.is_deleted) return null;

      await qb("rooms")
        .where({ room_id })
        .update({
          is_deleted: true,
          [TABLE_DEFAULTS.COLUMNS.UPDATED_AT.KEY]: qb.raw("CURRENT_TIMESTAMP")
        });

      return true;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }
}

module.exports = RoomModel;
