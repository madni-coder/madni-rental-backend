const express = require("express");
const {
    createTenant,
    deactivateTenant,
    getTenant,
    listTenants,
    updateTenant,
} = require("../controllers/tenantController");
const auth = require("../middleware/auth");
const { tenantRules, validateRequest } = require("../middleware/validate");
const { upload } = require("../lib/upload");

const router = express.Router();

router.use(auth);

router.get("/", listTenants);
router.post("/", upload.single("rentAgreement"), tenantRules, validateRequest, createTenant);
router.get("/:id", getTenant);
router.put("/:id", upload.single("rentAgreement"), tenantRules, validateRequest, updateTenant);
router.patch("/:id/deactivate", deactivateTenant);

module.exports = router;
