const API_BASE_URL = window.location.origin;

async function loadCollection() {
    const collectionList = document.getElementById('collectionList');
    collectionList.setAttribute('aria-busy', 'true');
    collectionList.innerHTML = '<p class="muted">Loading your albums…</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/albums`);
        const data = await response.json();

        if (!data.success) {
            collectionList.innerHTML = '<div class="banner bannerError">Could not load your collection.</div>';
            collectionList.setAttribute('aria-busy', 'false');
            return;
        }

        if (data.albums.length === 0) {
            collectionList.innerHTML = '<div class="emptyCollection"><p>No albums saved yet.</p><p><a href="/">Upload a cover to get started</a></p></div>';
            collectionList.setAttribute('aria-busy', 'false');
            return;
        }

        const albumsHTML = `
            <div class="albumGrid" role="list">
                ${data.albums.map(album => `
                    <article class="albumCard" role="listitem">
                        <img src="${album.image_url || '/placeholder.png'}" alt="${escapeAttr(`Album cover: ${album.album_name} by ${album.artist_name}`)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                        <div class="albumCardInfo">
                            <h3>${escapeHtml(album.album_name)}</h3>
                            <p class="albumCardArtist">${escapeHtml(album.artist_name)}</p>
                            ${album.release_date ? `<p class="albumCardDate">${escapeHtml(album.release_date)}</p>` : ''}
                        </div>
                    </article>
                `).join('')}
            </div>
        `;

        collectionList.innerHTML = albumsHTML;
        collectionList.setAttribute('aria-busy', 'false');

    } catch (error) {
        console.error('Load collection error:', error);
        collectionList.innerHTML = '<div class="banner bannerError">Something went wrong. Please refresh the page.</div>';
        collectionList.setAttribute('aria-busy', 'false');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text == null || text === '') return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

loadCollection();
