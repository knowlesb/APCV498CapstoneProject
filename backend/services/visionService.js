const fs = require('fs');
const path = require('path');
const vision = require('@google-cloud/vision');
require('../config/env');

const CREDENTIALS_HINT =
  'Create a Google Cloud service account with Vision API access. For local dev, set GOOGLE_APPLICATION_CREDENTIALS to the JSON key file path. For deployment, set GOOGLE_APPLICATION_CREDENTIALS_BASE64 to the base64-encoded JSON key. Enable the Vision API on that GCP project.';

let cachedClient = null;
let cachedInitError = null;

function getClient() {
  if (cachedInitError) {
    return { error: cachedInitError };
  }
  if (cachedClient) {
    return { client: cachedClient };
  }

  const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (encodedCredentials && String(encodedCredentials).trim()) {
    try {
      const credentials = JSON.parse(Buffer.from(encodedCredentials, 'base64').toString('utf8'));
      cachedClient = new vision.ImageAnnotatorClient({ credentials });
      return { client: cachedClient };
    } catch (err) {
      cachedInitError = `Invalid GOOGLE_APPLICATION_CREDENTIALS_BASE64. ${CREDENTIALS_HINT}`;
      return { error: cachedInitError };
    }
  }

  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw || !String(raw).trim()) {
    cachedInitError = `Missing Google Vision credentials. ${CREDENTIALS_HINT}`;
    return { error: cachedInitError };
  }

  const keyPath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  if (!fs.existsSync(keyPath)) {
    cachedInitError = `Credentials file not found: ${keyPath}. ${CREDENTIALS_HINT}`;
    return { error: cachedInitError };
  }

  try {
    cachedClient = new vision.ImageAnnotatorClient({ keyFilename: keyPath });
    return { client: cachedClient };
  } catch (err) {
    cachedInitError = err.message || 'Failed to initialize Vision client';
    return { error: cachedInitError };
  }
}

async function extractText(imageBuffer) {
  const { client, error } = getClient();
  if (error) {
    return {
      success: false,
      error: 'OCR_CONFIG_ERROR',
      extractedText: '',
      message: error
    };
  }

  try {
    const [result] = await client.textDetection({
      image: { content: imageBuffer }
    });

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return {
        success: false,
        error: 'NO_TEXT_EXTRACTED',
        extractedText: '',
        message: 'No text found in image'
      };
    }

    const fullText = detections[0].description || '';

    if (fullText.length < 5) {
      return {
        success: false,
        error: 'LOW_QUALITY_TEXT',
        extractedText: fullText,
        message: 'Extracted text is too short or unclear'
      };
    }

    return {
      success: true,
      extractedText: fullText,
      annotations: detections
    };
  } catch (err) {
    console.error('Google Vision API error:', err);
    return {
      success: false,
      error: 'OCR_API_ERROR',
      extractedText: '',
      message: err.message || 'OCR service error'
    };
  }
}

module.exports = { extractText };
