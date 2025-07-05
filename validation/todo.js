const { check } = require("express-validator");

const validate = {
  todoCreateVal: [
    check("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
  ],
};

module.exports = validate;
