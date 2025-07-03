const { check } = require("express-validator");

const validate = {
  packageCreateVal: [
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("ipType").trim().notEmpty().withMessage("IP type is required"),
    check("price")
      .isNumeric()
      .withMessage("Price is required")
      .custom((value) => {
        if (value < 0) {
          throw new Error("Price cannot be negative");
        }
        return true;
      }),
    check("vatType")
      .isIn(["fixed", "percent"])
      .withMessage("Vat Type is required"),
    check("vatAmount")
      .isNumeric()
      .withMessage("Vat Amount is required")
      .custom((value, { req }) => {
        if (req.body.vatType === "fixed" && value < 0) {
          throw new Error("Vat amount cannot be negative");
        } else if (req.body.vatType === "percent" && value < 0) {
          throw new Error("Vat percent cannot be negative");
        } else if (req.body.vatType === "percent" && value > 100) {
          throw new Error("Vat percent cannot be greater than 100");
        }
        return true;
      }),
  ],
};

module.exports = validate;
