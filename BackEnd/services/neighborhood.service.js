const Neighborhood = require('../models/neighborhood');

const getNeighborhoods = async () => {
  return await Neighborhood.find({}, 'name').sort({ name: 1 });
};

module.exports = { getNeighborhoods };
