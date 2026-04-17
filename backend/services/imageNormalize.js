const sharp = require('sharp');

const HEIC_LIKE = new Set(['image/heic', 'image/heif']);

/**
 * Google Cloud Vision does not accept HEIC/HEIF. Convert to JPEG for OCR.
 * Other types are passed through unchanged.
 */
async function bufferForVision(inputBuffer, mimetype) {
  const type = (mimetype || '').toLowerCase();
  if (!HEIC_LIKE.has(type)) {
    return inputBuffer;
  }

  try {
    return await sharp(inputBuffer).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  } catch (err) {
    err.code = 'HEIC_CONVERT_ERROR';
    err.cause = err;
    throw err;
  }
}

module.exports = { bufferForVision };
