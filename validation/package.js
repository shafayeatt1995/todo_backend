const { check } = require("express-validator");

const validate = {
  packageCreateVal: [
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("id").trim().notEmpty().withMessage("ID is required"),
    check("price")
      .isNumeric()
      .withMessage("Price is required")
      .custom((value) => {
        if (value < 0) {
          throw new Error("Price cannot be negative");
        }
        return true;
      }),
  ],
};

module.exports = validate;
