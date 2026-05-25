const onlyActive = (req, res, next) => {
  req.filter = { ...req.filter, isActive: true };
  next();
};

module.exports = onlyActive;