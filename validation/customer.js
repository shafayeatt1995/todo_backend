const { check } = require("express-validator");

const validate = {
  customerCreateVal: [
    check("id").trim().notEmpty().withMessage("ID is required"),
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("phone").trim().notEmpty().withMessage("Phone is required"),
  ],
};

module.exports = validate;
