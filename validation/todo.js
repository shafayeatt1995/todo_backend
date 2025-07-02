const { check } = require("express-validator");

const validate = {
  todoCreateVal: [
    check("title").trim().notEmpty().withMessage("Title is required"),
    check("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
  ],
};

module.exports = validate;
