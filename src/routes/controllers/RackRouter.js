const RackManager = require("../../businesslogic/managers/RackManager");
const express = require("express");
const router = express.Router({ mergeParams: true });
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");

/**
 * GET /list
 * Retrieves all racks with optional filters and pagination.
 * Query: warehouse_id, room_id, rack_name, page, limit
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.get('/list',
    appWrapper(async (req, res) => {
        const { warehouse_id, room_id, rack_name, page = 1, limit = 10 } = req.query;

        const filters = {};
        if (warehouse_id) filters.warehouse_id = Number(warehouse_id);
        if (room_id) filters.room_id = Number(room_id);
        if (rack_name) filters.rack_name = rack_name;

        const result = await RackManager.getAllRacks(filters, Number(page), Number(limit), res.locals.userInfo?.user?.user_id);

        return res.json({
            success: true,
            data: result.data,
            total: result.total,
            page: Number(page),
            limit: Number(limit)
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * GET /:id
 * Retrieves a specific rack by its ID.
 * Params: id
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.get('/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const rack = await RackManager.getRackById(rackId, res.locals.userInfo?.user?.user_id);

        return res.json({
            success: true,
            data: rack
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * POST /create
 * Creates a new rack.
 * Body: { warehouse_id, room_id, rack_name, etc. }
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.post('/create',
    appWrapper(async (req, res) => {
        const rack = await RackManager.createRack(req.body, res.locals.userInfo?.user?.user_id);

        return res.json({
            success: true,
            data: rack,
            message: "Rack created successfully"
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * PUT /:id
 * Updates an existing rack.
 * Params: id
 * Body: { ...rackData }
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.put('/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const rack = await RackManager.updateRack(rackId, req.body, res.locals.userInfo?.user?.user_id);

        return res.json({
            success: true,
            data: rack,
            message: "Rack updated successfully"
        });
    }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * DELETE /delete/:id
 * Deletes a rack by its ID (soft delete).
 * Params: id
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.delete('/delete/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const result = await RackManager.deleteRack(rackId, res.locals.userInfo?.user?.user_id);

        return res.json({
            success: true,
            data: result
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

module.exports = router;
