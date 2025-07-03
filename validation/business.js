const { check } = require("express-validator");

const validate = {
  businessCreateVal: [
    check("name").trim().notEmpty().withMessage("Name is required"),
    check("exp").custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Expired at must be a valid date");
      }
      return true;
    }),
  ],
};

module.exports = validate;
