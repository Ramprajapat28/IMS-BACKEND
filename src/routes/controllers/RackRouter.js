const RackManager = require("../../businesslogic/managers/RackManager");
const express = require("express");
const router = express.Router({ mergeParams: true });
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");

// Get all racks with filters
router.get('/list',
    appWrapper(async (req, res) => {
        const { warehouse_id, room_id, rack_name, page = 1, limit = 10 } = req.query;

        const filters = {};
        if (warehouse_id) filters.warehouse_id = Number(warehouse_id);
        if (room_id) filters.room_id = Number(room_id);
        if (rack_name) filters.rack_name = rack_name;

        const result = await RackManager.getAllRacks(filters, Number(page), Number(limit));

        return res.json({
            success: true,
            data: result.data,
            total: result.total,
            page: Number(page),
            limit: Number(limit)
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

// Get rack by ID
router.get('/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const rack = await RackManager.getRackById(rackId);

        return res.json({
            success: true,
            data: rack
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

// Create rack
router.post('/create',
    appWrapper(async (req, res) => {
        const rack = await RackManager.createRack(req.body);

        return res.json({
            success: true,
            data: rack,
            message: "Rack created successfully"
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

// Update rack
router.put('/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const rack = await RackManager.updateRack(rackId, req.body);

        return res.json({
            success: true,
            data: rack,
            message: "Rack updated successfully"
        });
    }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

// Delete rack (soft delete)
router.post('/delete/:id',
    appWrapper(async (req, res) => {
        const rackId = Number(req.params.id);
        const result = await RackManager.deleteRack(rackId);

        return res.json({
            success: true,
            data: result
        });
    }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

module.exports = router;
