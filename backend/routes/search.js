const express = require('express');
const router = express.Router();
const { searchSpotify } = require('../controllers/searchController');

router.post('/', searchSpotify);

module.exports = router;

