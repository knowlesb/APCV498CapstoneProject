const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif'
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Use JPG, PNG, or HEIC/HEIF.'),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload.single('image');

