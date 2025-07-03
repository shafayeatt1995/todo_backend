const { User } = require("../models");

const pc = (permission) => async (req, res, next) => {
  const { _id, isAdmin, isOwner, isStaff } = req.user;
  if (isOwner || isAdmin) {
    return next();
  } else if (isStaff) {
    const user = await User.findOne({ _id }).select({ permissions: 1 }).lean();
    if (user.permissions.includes(permission)) return next();
  }
  return res.status(403).json({ error: "Permission denied" });
};

module.exports = pc;
