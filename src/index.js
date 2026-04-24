require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const connectToDatabase = require("./lib/db");
const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const tenantRoutes = require("./routes/tenants");

const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = [
    "http://localhost:3000",
    "https://madni-rental.vercel.app",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    // Railway deployment domain (allow internal probes and any requests from the deployed host)
    "https://madni-rental-backend-production.up.railway.app",
];

app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: origin '${origin}' not allowed`));
        },
    }),
);
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Root route for platform health checks (some hosts probe "/")
app.get("/", (req, res) => {
    res.json({ status: "ok", service: "Razvi Rental API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    return res.status(error.status || 500).json({
        message: error.message || "Unexpected server error.",
    });
});

async function start() {
    if (!process.env.JWT_SECRET) {
        console.warn("Warning: JWT_SECRET is not set. Auth functionality may be degraded.");
    }

    try {
        await connectToDatabase();
    } catch (err) {
        console.error("Warning: could not connect to database:", err && err.message ? err.message : err);
        console.error("Continuing to start server so health checks pass. Configure MONGODB_URI in production.");
    }

    app.listen(port, () => {
        console.log(`Razvi Rental API listening on port ${port}`);
    });
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
});