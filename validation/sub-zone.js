const { check } = require("express-validator");

const validate = {
  subZoneCreateVal: [
    check("zoneID").trim().notEmpty().withMessage("Zone is required"),
    check("name").trim().notEmpty().withMessage("Name is required"),
  ],
};

module.exports = validate;
