const { decrypt, encrypt } = require("../lib/encryption");
const { uploadToCloudinary } = require("../lib/upload");
const Tenant = require("../models/Tenant");

// Projection used in list responses — omits encrypted sensitive fields
const LIST_SELECT = "-aadhaar -pan";

async function listTenants(req, res) {
    const query = { userId: req.user.id };

    if (req.query.search) {
        query.$or = [
            { fullName: { $options: "i", $regex: req.query.search } },
            { phone: { $options: "i", $regex: req.query.search } },
        ];
    }

    if (req.query.status === "active") {
        query.isActive = true;
    } else if (req.query.status === "inactive") {
        query.isActive = false;
    }

    const tenants = await Tenant.find(query)
        .select(LIST_SELECT)
        .populate("propertyId", "name")
        .sort({ createdAt: -1 })
        .lean();

    return res.json({ tenants });
}

async function getTenant(req, res) {
    const tenant = await Tenant.findOne({
        _id: req.params.id,
        userId: req.user.id,
    })
        .populate("propertyId", "name")
        .lean();

    if (!tenant) {
        return res.status(404).json({ message: "Tenant not found." });
    }

    // Decrypt sensitive fields for single-record view only
    if (tenant.aadhaar) {
        tenant.aadhaar = decrypt(tenant.aadhaar) ?? "[decryption failed]";
    }

    if (tenant.pan) {
        tenant.pan = decrypt(tenant.pan) ?? "[decryption failed]";
    }

    return res.json({ tenant });
}

async function createTenant(req, res) {
    // TC17: reject if another active tenant is already linked to this property
    const conflict = await Tenant.findOne({
        isActive: true,
        propertyId: req.body.propertyId,
        userId: req.user.id,
    });

    if (conflict) {
        return res.status(409).json({ message: "A tenant is already active in this property." });
    }

    let rentAgreementUrl = null;

    if (req.file) {
        try {
            const result = await uploadToCloudinary(
                req.file.buffer,
                `tenant-${Date.now()}`,
            );
            rentAgreementUrl = result.secure_url;
        } catch {
            return res.status(500).json({ message: "Failed to upload rent agreement." });
        }
    }

    const tenant = await Tenant.create({
        aadhaar: req.body.aadhaar ? encrypt(String(req.body.aadhaar)) : undefined,
        email: req.body.email || undefined,
        emergencyContact: req.body.emergencyContact || undefined,
        endDate: req.body.endDate || undefined,
        fullName: req.body.fullName,
        monthlyRent: Number(req.body.monthlyRent),
        notes: req.body.notes || undefined,
        pan: req.body.pan ? encrypt(String(req.body.pan)) : undefined,
        paymentDueDate: Number(req.body.paymentDueDate),
        phone: req.body.phone,
        propertyId: req.body.propertyId,
        rentAgreementUrl,
        securityDeposit: Number(req.body.securityDeposit),
        startDate: new Date(req.body.startDate),
        userId: req.user.id,
    });

    return res.status(201).json({ tenant });
}

async function updateTenant(req, res) {
    const existing = await Tenant.findOne({
        _id: req.params.id,
        userId: req.user.id,
    });

    if (!existing) {
        return res.status(404).json({ message: "Tenant not found." });
    }

    // TC16: block property reassignment while tenant is active
    const newPropertyId = req.body.propertyId || String(existing.propertyId);
    const isChangingProperty = String(newPropertyId) !== String(existing.propertyId);

    if (isChangingProperty && existing.isActive) {
        return res.status(422).json({
            message: "Current property mapping must be closed before reassignment.",
        });
    }

    // TC17: block if another active tenant already occupies the new property
    if (isChangingProperty) {
        const conflict = await Tenant.findOne({
            _id: { $ne: existing._id },
            isActive: true,
            propertyId: newPropertyId,
            userId: req.user.id,
        });

        if (conflict) {
            return res.status(409).json({ message: "A tenant is already active in this property." });
        }
    }

    let rentAgreementUrl = existing.rentAgreementUrl;

    if (req.file) {
        try {
            const result = await uploadToCloudinary(
                req.file.buffer,
                `tenant-${existing._id}`,
            );
            rentAgreementUrl = result.secure_url;
        } catch {
            return res.status(500).json({ message: "Failed to upload rent agreement." });
        }
    }

    const patch = {
        email: req.body.email !== undefined ? req.body.email || null : existing.email,
        emergencyContact: req.body.emergencyContact !== undefined
            ? req.body.emergencyContact || null
            : existing.emergencyContact,
        endDate: req.body.endDate !== undefined ? req.body.endDate || null : existing.endDate,
        fullName: req.body.fullName || existing.fullName,
        monthlyRent: req.body.monthlyRent !== undefined
            ? Number(req.body.monthlyRent)
            : existing.monthlyRent,
        notes: req.body.notes !== undefined ? req.body.notes || null : existing.notes,
        paymentDueDate: req.body.paymentDueDate !== undefined
            ? Number(req.body.paymentDueDate)
            : existing.paymentDueDate,
        phone: req.body.phone || existing.phone,
        propertyId: newPropertyId,
        rentAgreementUrl,
        securityDeposit: req.body.securityDeposit !== undefined
            ? Number(req.body.securityDeposit)
            : existing.securityDeposit,
        startDate: req.body.startDate ? new Date(req.body.startDate) : existing.startDate,
    };

    if (req.body.aadhaar !== undefined) {
        patch.aadhaar = req.body.aadhaar ? encrypt(String(req.body.aadhaar)) : null;
    }

    if (req.body.pan !== undefined) {
        patch.pan = req.body.pan ? encrypt(String(req.body.pan)) : null;
    }

    const updated = await Tenant.findByIdAndUpdate(existing._id, patch, { new: true })
        .select(LIST_SELECT)
        .populate("propertyId", "name");

    return res.json({ tenant: updated });
}

async function deactivateTenant(req, res) {
    const tenant = await Tenant.findOne({
        _id: req.params.id,
        userId: req.user.id,
    });

    if (!tenant) {
        return res.status(404).json({ message: "Tenant not found." });
    }

    if (!tenant.isActive) {
        return res.status(409).json({ message: "Tenant is already inactive." });
    }

    tenant.isActive = false;

    if (req.body.exitDate) {
        tenant.endDate = new Date(req.body.exitDate);
    }

    await tenant.save();

    // Pending-bill cascade cancellation will be wired here once Bill model is implemented
    return res.json({ message: "Tenant deactivated.", tenant });
}

module.exports = {
    createTenant,
    deactivateTenant,
    getTenant,
    listTenants,
    updateTenant,
};
