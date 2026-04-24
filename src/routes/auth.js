const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, logout, me, register } = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
    legacyHeaders: false,
    max: 10,
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", auth, me);
router.post("/logout", auth, logout);

module.exports = router;