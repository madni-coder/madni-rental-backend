const mongoose = require("mongoose");

let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "razvi_rental",
    });

    return cachedConnection;
}

module.exports = connectToDatabase;