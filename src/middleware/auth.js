const jwt = require("jsonwebtoken");
const { adminUser, cookieName } = require("../lib/admin");

function auth(req, res, next) {
    const token = req.cookies[cookieName];

    if (!token) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            email: decoded.email,
            id: decoded.id || adminUser.id,
            role: decoded.role || adminUser.role,
        };

        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired session." });
    }
}

module.exports = auth;