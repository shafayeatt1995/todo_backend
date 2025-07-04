const { check } = require("express-validator");

const validate = {
  zoneCreateVal: [
    check("name").trim().notEmpty().withMessage("Name is required"),
  ],
};

module.exports = validate;
