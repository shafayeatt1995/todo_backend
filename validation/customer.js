const { check } = require("express-validator");

const validate = {
  customerCreateVal: [
    check("id").trim().notEmpty().withMessage("ID is required"),
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .isLength({ min: 11, max: 11 })
      .withMessage("Phone must be 11 digits"),
    check("zoneID").trim().notEmpty().withMessage("Zone is required"),
  ],
};

module.exports = validate;
