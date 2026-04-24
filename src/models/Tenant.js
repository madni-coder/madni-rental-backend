const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
    {
        aadhaar: { type: String }, // AES-256-GCM encrypted at rest
        email: { trim: true, type: String },
        emergencyContact: { trim: true, type: String },
        endDate: { type: Date },
        fullName: { required: true, trim: true, type: String },
        isActive: { default: true, type: Boolean },
        monthlyRent: { required: true, type: Number },
        notes: { trim: true, type: String },
        pan: { type: String }, // AES-256-GCM encrypted at rest
        paymentDueDate: { max: 31, min: 1, required: true, type: Number },
        phone: { required: true, trim: true, type: String },
        propertyId: { ref: "Property", required: true, type: mongoose.Schema.Types.ObjectId },
        rentAgreementUrl: { type: String },
        securityDeposit: { required: true, type: Number },
        startDate: { required: true, type: Date },
        userId: { required: true, type: String },
    },
    { timestamps: true },
);

module.exports = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);