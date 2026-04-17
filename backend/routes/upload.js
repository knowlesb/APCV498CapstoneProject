const express = require('express');
const router = express.Router();
const { processUpload } = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/upload');

router.post('/', (req, res) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: err.message || 'Invalid file type.'
      });
    }
    processUpload(req, res);
  });
});

module.exports = router;

