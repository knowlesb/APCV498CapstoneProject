const API_BASE_URL = window.location.origin;

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif'
];

let currentExtractedArtist = '';
let currentExtractedAlbum = '';
let currentRawOcrText = '';

const imageInput = document.getElementById('imageInput');
const cameraPreview = document.getElementById('cameraPreview');
const cameraPreviewIdle = document.getElementById('cameraPreviewIdle');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnCapturePhoto = document.getElementById('btnCapturePhoto');
const btnStopCamera = document.getElementById('btnStopCamera');
const cameraReadyHint = document.getElementById('cameraReadyHint');
const defaultCameraReadyHint = cameraReadyHint?.innerHTML || 'Photo attached — tap <strong>Upload &amp; process</strong> below.';

let liveCameraStream = null;

function updateSelectedFileFeedback(file) {
    if (!file) {
        cameraReadyHint?.classList.add('hidden');
        if (cameraReadyHint) {
            cameraReadyHint.innerHTML = defaultCameraReadyHint;
        }
        return;
    }

    const safeName = escapeHtml(file.name || 'unnamed-image');
    if (cameraReadyHint) {
        cameraReadyHint.innerHTML = `Image attached: <strong>${safeName}</strong> — tap <strong>Upload &amp; process</strong> below.`;
        cameraReadyHint.classList.remove('hidden');
    }
    showStatus(`Image selected: ${file.name || 'unnamed-image'}`, 'success');
}

function attachImageFile(file) {
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showStatus('Unsupported image type. Use JPG, PNG, or HEIC.', 'error');
        return false;
    }
    if (file.size > 5 * 1024 * 1024) {
        showStatus('That image is over 5MB. Use a smaller file.', 'error');
        return false;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    imageInput.files = dt.files;

    updateSelectedFileFeedback(file);
    document.getElementById('uploadForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return true;
}

function setLivePreviewActive(active) {
    if (cameraPreview) {
        cameraPreview.classList.toggle('isLive', active);
    }
    if (cameraPreviewIdle) {
        cameraPreviewIdle.classList.toggle('hidden', active);
    }
    if (btnCapturePhoto) btnCapturePhoto.disabled = !active;
    if (btnStopCamera) btnStopCamera.disabled = !active;
    if (btnStartCamera) btnStartCamera.disabled = active;
}

function stopLiveCamera() {
    if (liveCameraStream) {
        liveCameraStream.getTracks().forEach((t) => t.stop());
        liveCameraStream = null;
    }
    if (cameraPreview) {
        cameraPreview.srcObject = null;
    }
    setLivePreviewActive(false);
}

async function startLiveCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        showStatus('This browser cannot use the live camera here. Choose an image below instead.', 'error');
        return;
    }
    try {
        stopLiveCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        liveCameraStream = stream;
        cameraPreview.srcObject = stream;
        await cameraPreview.play();
        setLivePreviewActive(true);
    } catch (err) {
        console.warn('getUserMedia', err);
        showStatus('Could not open the camera. Allow permission in your browser, or choose an image below.', 'error');
        stopLiveCamera();
    }
}

function captureFromLiveCamera() {
    const video = cameraPreview;
    if (!video?.srcObject || !liveCameraStream) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
        showStatus('Camera is not ready yet. Wait a moment or try again.', 'error');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
        (blob) => {
            if (!blob) {
                showStatus('Could not capture image. Try again.', 'error');
                return;
            }
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `camera-capture-${stamp}.jpg`, { type: 'image/jpeg' });
            if (attachImageFile(file)) {
                stopLiveCamera();
            }
        },
        'image/jpeg',
        0.92
    );
}

if (btnStartCamera) {
    btnStartCamera.addEventListener('click', () => {
        startLiveCamera();
    });
}
if (btnCapturePhoto) {
    btnCapturePhoto.addEventListener('click', () => {
        captureFromLiveCamera();
    });
}
if (btnStopCamera) {
    btnStopCamera.addEventListener('click', () => {
        stopLiveCamera();
    });
}

if (imageInput) {
    imageInput.addEventListener('change', () => {
        const selectedFile = imageInput.files?.[0] || null;
        updateSelectedFileFeedback(selectedFile);
    });
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Please select an image file', 'error');
        return;
    }

    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showStatus('Invalid file type. Use JPG, PNG, or HEIC/HEIF.', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('File size exceeds 5MB limit.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    showStatus('Processing image...', 'info');
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.setAttribute('aria-busy', 'true');

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            handleUploadError(data);
            return;
        }

        currentExtractedArtist = data.extractedArtist;
        currentExtractedAlbum = data.extractedAlbum;
        currentRawOcrText = data.rawOcrText || '';
        
        showStatus('Text extracted successfully. Searching Spotify...', 'success');
        await searchSpotify(data.extractedArtist, data.extractedAlbum);

    } catch (error) {
        console.error('Upload error:', error);
        showStatus('Error uploading image. Please try again.', 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.removeAttribute('aria-busy');
    }
});

function handleUploadError(data) {
    const { error, extractedText, extractedArtist, extractedAlbum, message } = data;

    if (error === 'NO_TEXT_EXTRACTED' || error === 'LOW_QUALITY_TEXT') {
        showManualEntry(extractedText || '');
        showStatus(message || 'Could not extract text clearly. Please enter manually.', 'error');
    } else if (error === 'INVALID_EXTRACTION') {
        showManualEntry('', extractedArtist, extractedAlbum);
        showStatus(message || 'Could not identify artist and album. Please complete the fields.', 'error');
    } else if (error === 'HEIC_CONVERT_ERROR') {
        showStatus(message || 'Could not process this HEIC image. Try another photo or export as JPEG.', 'error');
    } else {
        showStatus(message || 'Error processing image.', 'error');
    }
}

function showManualEntry(text = '', artist = '', album = '') {
    const manualEntry = document.getElementById('manualEntry');
    manualEntry.classList.remove('hidden');
    manualEntry.setAttribute('aria-hidden', 'false');
    document.getElementById('manualArtist').value = artist;
    document.getElementById('manualAlbum').value = album;

    if (text && !artist && !album) {
        document.getElementById('manualArtist').value = '';
        document.getElementById('manualAlbum').value = text;
    }
    requestAnimationFrame(() => document.getElementById('manualArtist').focus());
}

document.getElementById('manualForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const artist = document.getElementById('manualArtist').value.trim();
    const album = document.getElementById('manualAlbum').value.trim();
    
    if (!artist || !album) {
        showStatus('Please enter both artist and album.', 'error');
        return;
    }

    currentExtractedArtist = artist;
    currentExtractedAlbum = album;
    currentRawOcrText = currentRawOcrText || '';
    
    showStatus('Searching Spotify...', 'info');
    await searchSpotify(artist, album);
});

async function searchSpotify(artist, album) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ artist, album })
        });

        const data = await response.json();

        if (!data.success) {
            if (data.error === 'SPOTIFY_API_ERROR') {
                showStatus('Spotify service temporarily unavailable. Please try again in a few minutes.', 'error');
            } else {
                showStatus(data.message || 'Error searching Spotify.', 'error');
            }
            return;
        }

        if (data.results.length === 0) {
            showNoResults(artist, album);
            return;
        }

        displayResults(data.results, data.warning);

    } catch (error) {
        console.error('Search error:', error);
        showStatus('Error searching Spotify. Please try again.', 'error');
    }
}

function showNoResults(artist, album) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');
    resultsSection.setAttribute('aria-hidden', 'false');
    document.getElementById('resultsList').innerHTML = `
        <div class="banner bannerError">
            <p>No matches found for <strong>${escapeHtml(artist)}</strong> — <strong>${escapeHtml(album)}</strong>.</p>
            <p>Try manual entry or different wording, then search again.</p>
        </div>
    `;
    requestAnimationFrame(() => document.getElementById('results-heading')?.focus());
}

function displayResults(results, warning) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');
    resultsSection.setAttribute('aria-hidden', 'false');

    if (warning === 'LOW_CONFIDENCE') {
        document.getElementById('resultsWarning').classList.remove('hidden');
        document.getElementById('resultsWarning').textContent = 'Low confidence matches found. Please verify before saving.';
    } else {
        document.getElementById('resultsWarning').classList.add('hidden');
    }

    const resultsHTML = results.map(result => `
        <div class="resultItem">
            <img src="${result.imageUrl || '/placeholder.png'}" alt="${escapeAttr(`Album cover: ${result.name} by ${result.artist}`)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'%3E%3Crect fill=\'%23ddd\' width=\'150\' height=\'150\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E'">
            <div class="resultInfo">
                <h3>${escapeHtml(result.name)}</h3>
                <p class="resultMeta"><strong>Artist</strong> — ${escapeHtml(result.artist)}</p>
                ${result.releaseDate ? `<p class="resultMeta"><strong>Released</strong> — ${escapeHtml(result.releaseDate)}</p>` : ''}
            </div>
            <button type="button" class="btn btnBlue btnSelect" onclick="selectAlbum('${result.id}', '${escapeHtml(result.name)}', '${escapeHtml(result.artist)}', '${result.releaseDate || ''}', '${result.imageUrl || ''}')">Save</button>
        </div>
    `).join('');

    document.getElementById('resultsList').innerHTML = resultsHTML;
    requestAnimationFrame(() => document.getElementById('results-heading')?.focus());
}

async function selectAlbum(spotifyId, name, artist, releaseDate, imageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/albums`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                spotifyId,
                artistName: artist,
                albumName: name,
                releaseDate,
                imageUrl,
                extractedArtist: currentExtractedArtist || null,
                extractedAlbum: currentExtractedAlbum || null,
                rawOcrText: currentRawOcrText || null
            })
        });

        const data = await response.json();

        if (data.success) {
            showStatus('Album saved successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/collection';
            }, 1500);
        } else {
            showStatus(data.message || 'Error saving album.', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showStatus('Error saving album. Please try again.', 'error');
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = message;
    const statusKind = type.charAt(0).toUpperCase() + type.slice(1);
    statusDiv.className = `statusSlot status${statusKind}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Safe for HTML attribute values (e.g. alt="..."). */
function escapeAttr(text) {
    if (text == null || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

