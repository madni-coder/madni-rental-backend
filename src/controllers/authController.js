const jwt = require("jsonwebtoken");
const { adminPassword, adminUser, cookieName } = require("../lib/admin");

function buildCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
    };
}

function signToken() {
    return jwt.sign(
        {
            email: adminUser.email,
            id: adminUser.id,
            role: adminUser.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        },
    );
}

async function login(req, res) {
    const { email, password } = req.body;

    if (email !== adminUser.email || password !== adminPassword) {
        return res.status(401).json({
            message: "Use the configured admin credentials.",
        });
    }

    const token = signToken();

    res.cookie(cookieName, token, buildCookieOptions());

    return res.json({
        token,
        user: adminUser,
    });
}

async function me(req, res) {
    return res.json({
        user: adminUser,
    });
}

async function logout(req, res) {
    res.clearCookie(cookieName, buildCookieOptions());

    return res.status(200).json({
        message: "Logged out.",
    });
}

async function register(req, res) {
    return res.status(403).json({
        message: "Registration is disabled for this admin-only build.",
    });
}

module.exports = {
    login,
    logout,
    me,
    register,
};