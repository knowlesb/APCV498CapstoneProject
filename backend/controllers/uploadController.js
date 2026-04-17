const { extractText } = require('../services/visionService');
const { splitArtistAlbum } = require('../services/textCleanup');
const { bufferForVision } = require('../services/imageNormalize');

const allowedMime = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif'
];

async function processUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'NO_FILE',
      message: 'No image file provided'
    });
  }

  // Validate file type
  if (!allowedMime.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Use JPG, PNG, or HEIC/HEIF.'
    });
  }

  // Validate file size (5MB max)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      message: 'File size exceeds 5MB limit'
    });
  }

  try {
    let imageBuffer;
    try {
      imageBuffer = await bufferForVision(req.file.buffer, req.file.mimetype);
    } catch (convErr) {
      if (convErr.code === 'HEIC_CONVERT_ERROR') {
        console.error('HEIC conversion error:', convErr);
        return res.status(400).json({
          success: false,
          error: 'HEIC_CONVERT_ERROR',
          message:
            'Could not read this HEIC/HEIF image. Try re-exporting as JPEG or use a different photo.'
        });
      }
      throw convErr;
    }

    const ocrResult = await extractText(imageBuffer);

    if (!ocrResult.success) {
      return res.status(200).json({
        success: false,
        error: ocrResult.error,
        message: ocrResult.message,
        extractedText: ocrResult.extractedText || ''
      });
    }

    const { artist, album } = splitArtistAlbum(ocrResult.extractedText);

    if (!artist || artist.length === 0 || !album || album.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'INVALID_EXTRACTION',
        message: 'Could not identify artist and album from extracted text',
        extractedArtist: artist || '',
        extractedAlbum: album || '',
        rawOcrText: ocrResult.extractedText
      });
    }

    return res.json({
      success: true,
      extractedArtist: artist,
      extractedAlbum: album,
      rawOcrText: ocrResult.extractedText
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'PROCESSING_ERROR',
      message: 'Error processing image'
    });
  }
}

module.exports = { processUpload };

