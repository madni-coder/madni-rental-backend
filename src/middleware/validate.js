const { body, validationResult } = require("express-validator");

const propertyRules = [
    body("name").trim().notEmpty().withMessage("Property name is required."),
    body("type")
        .isIn(["apartment", "commercial", "house"])
        .withMessage("Property type must be apartment, commercial, or house."),
    body("plannedRent")
        .isFloat({ gt: 0 })
        .withMessage("Planned rent must be greater than zero."),
    body("address").trim().notEmpty().withMessage("Address is required."),
    body("floors")
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage("Floors must be a whole number or empty."),
    body("areaSqFt")
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage("Area must be a number or empty."),
    body("amenities")
        .optional()
        .isArray()
        .withMessage("Amenities must be a list."),
    body("amenities.*")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 80 })
        .withMessage("Each amenity must be shorter than 80 characters."),
    body("notes")
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 2000 })
        .withMessage("Notes must be shorter than 2000 characters."),
];

function validateRequest(req, res, next) {
    const result = validationResult(req);

    if (result.isEmpty()) {
        return next();
    }

    const errors = result.array().reduce((accumulator, error) => {
        if (!accumulator[error.path]) {
            accumulator[error.path] = error.msg;
        }

        return accumulator;
    }, {});

    return res.status(400).json({
        errors,
        message: "Validation failed.",
    });
}

const tenantRules = [
    body("fullName").trim().notEmpty().withMessage("Full name is required."),
    body("phone").trim().notEmpty().withMessage("Phone number is required."),
    body("propertyId").notEmpty().withMessage("Property is required."),
    body("monthlyRent")
        .notEmpty().withMessage("Monthly rent is required.")
        .isFloat({ gt: 0 }).withMessage("Monthly rent must be greater than zero.")
        .toFloat(),
    body("securityDeposit")
        .notEmpty().withMessage("Security deposit is required.")
        .isFloat({ min: 0 }).withMessage("Security deposit must be 0 or more.")
        .toFloat(),
    body("paymentDueDate")
        .notEmpty().withMessage("Payment due date is required.")
        .isInt({ max: 31, min: 1 }).withMessage("Payment due date must be between 1 and 31.")
        .toInt(),
    body("startDate")
        .notEmpty().withMessage("Start date is required.")
        .isISO8601().withMessage("Start date must be a valid date."),
    body("endDate")
        .optional({ checkFalsy: true })
        .isISO8601().withMessage("End date must be a valid date."),
    body("email")
        .optional({ checkFalsy: true })
        .isEmail().withMessage("Email must be a valid address."),
    body("emergencyContact").optional({ nullable: true }),
    body("aadhaar").optional({ nullable: true }),
    body("pan").optional({ nullable: true }),
    body("notes")
        .optional({ nullable: true })
        .isLength({ max: 2000 })
        .withMessage("Notes must be fewer than 2000 characters."),
];

module.exports = {
    propertyRules,
    tenantRules,
    validateRequest,
};