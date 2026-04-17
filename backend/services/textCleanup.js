/** Words that look like title fragments, not a solo artist name */
const COMMON_TITLE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'from', 'with', 'my', 'your',
  'never', 'too', 'much', 'all', 'live', 'greatest', 'best', 'vol', 'volume', 'part', 'cd',
  'lp', 'vinyl', 'remastered', 'remaster', 'explicit', 'deluxe', 'edition', 'feat', 'featuring'
]);

function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text.toUpperCase();

  cleaned = cleaned.replace(/[^A-Z0-9\s\-'&]/g, '');

  const noiseWords = ['ALBUM', 'CD', 'DIGITAL', 'EXPLICIT', 'EXPLICIT CONTENT', 'LP', 'VINYL'];
  noiseWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  cleaned = cleaned.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned;
}

/** OCR often inserts hyphens inside titles ("Never - Too") or between words ("Too-Luther") */
function normalizeOcrHyphens(cleaned) {
  let s = cleaned;

  s = s.replace(/\b(\w+)\s*-\s+(\w+)\b/g, (match, a, b) => {
    if (COMMON_TITLE_WORDS.has(a.toLowerCase()) && b.length <= 6) {
      return `${a} ${b}`;
    }
    return match;
  });

  s = s.replace(/\b(\w+)-\s+(\w+)\b/g, '$1 $2');
  s = s.replace(/\b(\w+)-(\w+)\b/g, '$1 $2');

  return s.replace(/\s+/g, ' ').trim();
}

function isLikelyNameWord(w) {
  if (!w || w.length < 2) return false;
  if (COMMON_TITLE_WORDS.has(w.toLowerCase())) return false;
  return /^[A-Z][a-z]{2,}$/.test(w) || /^[A-Z][a-z]+-[A-Z][a-z]+$/.test(w);
}

/**
 * Finds a two-word proper name (e.g. "Luther Vandross") in the token stream and splits
 * album around it — fixes OCR that concatenates title + artist in one line.
 */
function splitByEmbeddedArtistName(cleaned) {
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;

  for (let i = 0; i < words.length - 1; i++) {
    if (!isLikelyNameWord(words[i]) || !isLikelyNameWord(words[i + 1])) continue;

    const artist = `${words[i]} ${words[i + 1]}`;
    const before = words.slice(0, i).join(' ');
    const after = words.slice(i + 2).join(' ');
    const album = [before, after].filter(Boolean).join(' ').trim();

    if (album.length >= 3) {
      return { artist, album };
    }
  }
  return null;
}

function splitByNewlines(cleaned) {
  if (!cleaned.includes('\n')) return null;

  const lines = cleaned.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return null;

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length === 2 && isLikelyNameWord(parts[0]) && isLikelyNameWord(parts[1])) {
      const other = lines.filter((l) => l !== line).join(' ');
      if (other.length > 0) {
        return { artist: line, album: other };
      }
    }
  }

  return {
    artist: lines[0],
    album: lines.slice(1).join(' ')
  };
}

function splitArtistAlbum(text) {
  let cleaned = cleanText(text);

  if (typeof cleaned !== 'string' || cleaned.length === 0) {
    return { artist: '', album: '' };
  }

  cleaned = normalizeOcrHyphens(cleaned);

  const byNewline = splitByNewlines(cleaned);
  if (byNewline) {
    return byNewline;
  }

  if (cleaned.includes(' By ')) {
    const parts = cleaned.split(' By ');
    return {
      artist: parts[0].trim(),
      album: parts.slice(1).join(' By ').trim()
    };
  }

  if (cleaned.includes(' — ') || cleaned.includes(' – ')) {
    const parts = cleaned.split(/[—–]/);
    return {
      artist: parts[0].trim(),
      album: parts.slice(1).join(' ').trim()
    };
  }

  const embedded = splitByEmbeddedArtistName(cleaned);
  if (embedded) {
    return embedded;
  }

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    const first = parts[0].trim();
    const rest = parts.slice(1).join(' - ').trim();
    if (parts.length >= 2 && first.split(/\s+/).length === 1 && COMMON_TITLE_WORDS.has(first.toLowerCase())) {
      const merged = `${first} ${rest}`;
      const retry = splitByEmbeddedArtistName(merged);
      if (retry) return retry;
      return { artist: first, album: rest };
    }
    return {
      artist: first,
      album: rest
    };
  }

  const words = cleaned.split(' ');
  if (words.length === 1) {
    return { artist: words[0], album: '' };
  }

  return {
    artist: words[0],
    album: words.slice(1).join(' ')
  };
}

module.exports = { cleanText, splitArtistAlbum };
