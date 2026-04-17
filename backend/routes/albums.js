const express = require('express');
const router = express.Router();
const { getAlbums, createAlbum } = require('../controllers/albumController');

router.get('/', getAlbums);
router.post('/', createAlbum);

module.exports = router;

