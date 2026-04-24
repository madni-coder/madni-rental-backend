const express = require("express");
const {
    createProperty,
    deleteProperty,
    getProperty,
    listProperties,
    updateProperty,
} = require("../controllers/propertyController");
const auth = require("../middleware/auth");
const { propertyRules, validateRequest } = require("../middleware/validate");

const router = express.Router();

router.use(auth);

router.get("/", listProperties);
router.post("/", propertyRules, validateRequest, createProperty);
router.get("/:id", getProperty);
router.put("/:id", propertyRules, validateRequest, updateProperty);
router.delete("/:id", deleteProperty);

module.exports = router;