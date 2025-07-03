const { check } = require("express-validator");

const validate = {
  contactCreateVal: [
    check("id").trim().notEmpty().withMessage("ID is required"),
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("phone").trim().notEmpty().withMessage("Phone is required"),
    check("address").trim().notEmpty().withMessage("Address is required"),
    check("packageID").trim().notEmpty().withMessage("Package is required"),
  ],
};

module.exports = validate;
