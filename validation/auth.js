const { check } = require("express-validator");
const { User, Business } = require("../models");
const bcrypt = require("bcryptjs");

const validate = {
  loginValidation: [
    check("id")
      .trim()
      .custom(async (value, { req }) => {
        try {
          const { id } = req.body;
          const user = await User.findOne({ id: value })
            .select("+password +suspended +power")
            .lean();
          if (user) {
            const check = await bcrypt.compare(
              req.body.password,
              user.password
            );
            if (check) {
              if (user.suspended) {
                throw new Error(`Account suspended`);
              } else {
                let business = null;
                if (user.businessID) {
                  business = await Business.findOne({
                    _id: user.businessID,
                    exp: { $gte: new Date() },
                  }).lean();
                }
                req.user = { ...user, business };
              }
            } else {
              throw new Error(`Login failed. Invalid credentials.`);
            }
          } else {
            throw new Error(`Login failed. Invalid credentials.`);
          }
        } catch (err) {
          throw new Error(err.message);
        }
      }),
    check("password")
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters"),
  ],
};

module.exports = validate;
