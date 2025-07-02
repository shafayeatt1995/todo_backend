const isAdmin = async (req, res, next) => {
  try {
    const { isAdmin } = req.user;
    if (isAdmin) {
      next();
    } else {
      throw new Error("Unauthorized");
    }
  } catch (error) {
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }
};

module.exports = isAdmin;
