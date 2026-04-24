const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            required: true,
            trim: true,
            type: String,
            unique: true,
        },
        name: {
            required: true,
            trim: true,
            type: String,
        },
        passwordHash: {
            required: true,
            type: String,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);