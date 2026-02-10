const BaseModel = require("./libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");

class RackModel extends BaseModel {
    constructor(userId) {
        super(userId);
    }

    getPublicColumns() {
        return ["rack_id", "rack_name", "warehouse_id", "room_id", "capacity"];
    }

    async getAllRackPaginated(filters = {}, page = 1, limit = 10) {
        try {
            const qb = await this.getQueryBuilder();
            const offset = (page - 1) * limit;

            const selectColumns = [
                // Rack columns
                "racks.rack_id",
                "racks.rack_name",
                "racks.capacity",
                "racks.room_id",
                "racks.warehouse_id",
                "racks.created_at",
                "racks.updated_at",

                // Room columns
                "rooms.room_name",

                // Warehouse columns
                "warehouses.name as warehouse_name",
            ];

            let query = qb("racks")
                .select(selectColumns)
                .leftJoin("rooms", "racks.room_id", "rooms.room_id")
                .leftJoin("warehouses", "racks.warehouse_id", "warehouses.warehouse_id")
                .where("racks.is_deleted", false);

            // Optional filters
            if (filters.room_id) {
                query = query.where("racks.room_id", filters.room_id);
            }
            if (filters.warehouse_id) {
                query = query.where("racks.warehouse_id", filters.warehouse_id);
            }
            if (filters.rack_name) {
                query = query.whereILike("racks.rack_name", `%${filters.rack_name}%`);
            }

            const data = await query
                .orderBy("racks.created_at", "desc")
                .limit(limit)
                .offset(offset);

            // Count query
            let countQuery = qb("racks").where("racks.is_deleted", false);

            if (filters.room_id) {
                countQuery = countQuery.where("racks.room_id", filters.room_id);
            }
            if (filters.warehouse_id) {
                countQuery = countQuery.where("racks.warehouse_id", filters.warehouse_id);
            }
            if (filters.rack_name) {
                countQuery = countQuery.whereILike("racks.rack_name", `%${filters.rack_name}%`);
            }

            const [{ count }] = await countQuery.count("* as count");

            return {
                data,
                total: Number(count),
            };
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async createRack(data) {
        try {
            const qb = await this.getQueryBuilder();
            const insertData = this.insertStatement(data);

            const [rack] = await qb("racks")
                .insert(insertData)
                .returning(this.getPublicColumns());

            return rack;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async getRackById(id) {
        try {
            const qb = await this.getQueryBuilder();

            const rack = await qb("racks")
                .select([
                    "racks.rack_id",
                    "racks.rack_name",
                    "racks.capacity",
                    "racks.room_id",
                    "racks.warehouse_id",
                    "racks.created_at",
                    "racks.updated_at",
                    "rooms.room_name",
                    "warehouses.name as warehouse_name",
                ])
                .leftJoin("rooms", "racks.room_id", "rooms.room_id")
                .leftJoin("warehouses", "racks.warehouse_id", "warehouses.warehouse_id")
                .where("racks.rack_id", id)
                .first();

            return rack || null;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async updateRack(id, data) {
        try {
            const qb = await this.getQueryBuilder();
            const updateData = await this.updateStatement(data);

            const exists = await qb("racks")
                .select("rack_id")
                .where(this.whereStatement({ rack_id: id }))
                .first();

            if (!exists) return null;

            const [rack] = await qb("racks")
                .update(updateData)
                .where(this.whereStatement({ rack_id: id }))
                .returning(this.getPublicColumns());

            return rack;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async deleteRack(id) {
        try {
            const qb = await this.getQueryBuilder();

            const exists = await qb("racks")
                .select("rack_id")
                .where(this.whereStatement({ rack_id: id }))
                .first();

            if (!exists) return null;

            const [rack] = await qb("racks")
                .update({ is_deleted: true })
                .where(this.whereStatement({ rack_id: id }))
                .returning(this.getPublicColumns());

            return rack;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }
}

module.exports = RackModel;
