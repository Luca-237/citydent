const { getNeighborhoods } = require('../services/neighborhood.service');

const fetchNeighborhoods = async (req, res) => {
  try {
    const neighborhoods = await getNeighborhoods();
    res.status(200).json({ success: true, neighborhoods });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { fetchNeighborhoods };
