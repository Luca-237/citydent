const express = require('express');
const router = express.Router();
const { fetchNeighborhoods } = require('../controllers/neighborhood.controller');

router.get('/', fetchNeighborhoods);

module.exports = router;
