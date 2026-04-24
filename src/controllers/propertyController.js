const mongoose = require("mongoose");
const Property = require("../models/Property");
const Tenant = require("../models/Tenant");

function normalizePayload(body) {
    return {
        address: body.address.trim(),
        amenities: Array.isArray(body.amenities)
            ? body.amenities
                .map((item) => String(item).trim())
                .filter(Boolean)
            : [],
        areaSqFt: body.areaSqFt === null || body.areaSqFt === undefined || body.areaSqFt === ""
            ? null
            : Number(body.areaSqFt),
        floors: body.floors === null || body.floors === undefined || body.floors === ""
            ? null
            : Number(body.floors),
        name: body.name.trim(),
        notes: body.notes ? String(body.notes).trim() : "",
        plannedRent: Number(body.plannedRent),
        type: body.type,
    };
}

async function attachOccupancy(properties, userId) {
    if (!properties.length) {
        return [];
    }

    const propertyIds = properties.map((property) => property._id);
    const occupancyRows = await Tenant.aggregate([
        {
            $match: {
                isActive: true,
                propertyId: {
                    $in: propertyIds,
                },
                userId,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $group: {
                _id: "$propertyId",
                activeTenantCount: {
                    $sum: 1,
                },
                currentTenant: {
                    $first: "$fullName",
                },
            },
        },
    ]);

    const occupancyMap = new Map(
        occupancyRows.map((row) => [String(row._id), row]),
    );

    return properties.map((property) => {
        const occupancy = occupancyMap.get(String(property._id));
        const activeTenantCount = occupancy?.activeTenantCount ?? 0;

        return {
            ...property,
            activeTenantCount,
            currentTenant: occupancy?.currentTenant ?? null,
            status: activeTenantCount > 0 ? "active" : "inactive",
        };
    });
}

async function listProperties(req, res) {
    const query = {
        userId: req.user.id,
    };

    if (req.query.search) {
        query.$or = [
            { address: { $regex: req.query.search, $options: "i" } },
            { name: { $regex: req.query.search, $options: "i" } },
        ];
    }

    const properties = await Property.find(query).sort({ createdAt: -1 }).lean();
    let hydrated = await attachOccupancy(properties, req.user.id);

    if (req.query.status === "active" || req.query.status === "inactive") {
        hydrated = hydrated.filter((property) => property.status === req.query.status);
    }

    return res.json({
        properties: hydrated,
    });
}

async function getProperty(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Property not found." });
    }

    const property = await Property.findOne({
        _id: req.params.id,
        userId: req.user.id,
    }).lean();

    if (!property) {
        return res.status(404).json({ message: "Property not found." });
    }

    const [hydrated] = await attachOccupancy([property], req.user.id);

    return res.json({
        property: hydrated,
    });
}

async function createProperty(req, res) {
    const property = await Property.create({
        ...normalizePayload(req.body),
        userId: req.user.id,
    });

    return res.status(201).json({
        property,
    });
}

async function updateProperty(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Property not found." });
    }

    const property = await Property.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.user.id,
        },
        normalizePayload(req.body),
        {
            new: true,
            runValidators: true,
        },
    );

    if (!property) {
        return res.status(404).json({ message: "Property not found." });
    }

    return res.json({
        property,
    });
}

async function deleteProperty(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Property not found." });
    }

    const activeTenantCount = await Tenant.countDocuments({
        isActive: true,
        propertyId: req.params.id,
        userId: req.user.id,
    });

    if (activeTenantCount > 0) {
        return res.status(409).json({
            message: "Cannot delete property with active tenants.",
        });
    }

    const deletedProperty = await Property.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id,
    });

    if (!deletedProperty) {
        return res.status(404).json({ message: "Property not found." });
    }

    return res.status(200).json({
        message: "Property deleted.",
    });
}

module.exports = {
    createProperty,
    deleteProperty,
    getProperty,
    listProperties,
    updateProperty,
};