const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        address: {
            required: true,
            trim: true,
            type: String,
        },
        amenities: {
            default: [],
            type: [String],
        },
        areaSqFt: {
            default: null,
            type: Number,
        },
        floors: {
            default: null,
            type: Number,
        },
        name: {
            required: true,
            trim: true,
            type: String,
        },
        notes: {
            default: "",
            trim: true,
            type: String,
        },
        plannedRent: {
            required: true,
            type: Number,
        },
        type: {
            enum: ["apartment", "commercial", "house"],
            required: true,
            type: String,
        },
        userId: {
            required: true,
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.models.Property || mongoose.model("Property", propertySchema);