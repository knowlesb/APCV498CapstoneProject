# Capstone Project Plan (Current State)
**Project:** Album Cover OCR -> Spotify Metadata -> Personal Database  
**Course:** APCV498 Capstone  
**Current Status:** Core MVP implemented and running locally

**Note:** Document structure and organization assisted by Claude AI. All project requirements, technical decisions, and implementation plans are original work.

---

## 1) Project Overview

This application lets a user upload an album cover image, extract text using Google Cloud Vision OCR, search Spotify for likely matches, and save selected albums into a MySQL database collection.

Current app flow:
1. Upload image (`JPG`/`PNG`, max 5MB)
2. OCR extracts raw text
3. Backend parses artist/album
4. Spotify search returns ranked candidates
5. User selects match
6. Album is stored in MySQL
7. Collection page displays saved albums

---

## 2) What Is Implemented Now

### Functional Features
- Image upload form with client/server validation
- OCR integration via `@google-cloud/vision`
- Text cleanup + artist/album parsing heuristics
- Spotify API integration using client credentials flow
- Ranked result display (top matches)
- Manual fallback for OCR failure/low quality extraction
- Save selected album to MySQL
- Collection page with saved albums list

### Error Handling Implemented
- Invalid file type/size
- OCR config/API failures
- Empty/low-quality OCR text
- Invalid artist/album extraction
- Spotify API failures
- No Spotify matches found
- Database save/read errors

---

## 3) Current Technical Architecture

### Stack
- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS + HTML/CSS
- **Database:** MySQL
- **OCR:** Google Cloud Vision API
- **Music Metadata:** Spotify Web API

### Folder Structure (as-built)

```text
Capstone/
├── frontend/
│   ├── index.html
│   ├── collection.html
│   ├── css/styles.css
│   └── js/
│       ├── upload.js
│       └── collection.js
├── backend/
│   ├── server.js
│   ├── config/database.js
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   │   ├── visionService.js
│   │   ├── spotifyService.js
│   │   └── textCleanup.js
│   ├── models/albumModel.js
│   └── middleware/upload.js
├── database/schema.sql
├── package.json
└── CAPSTONE_PLAN.md
```

### API Endpoints
- `POST /api/upload` - process image and extract artist/album
- `POST /api/search` - search Spotify with parsed values
- `GET /api/albums` - list saved albums
- `POST /api/albums` - save selected album

---

## 4) Environment and Runtime Requirements

Required environment variables:
- `GOOGLE_APPLICATION_CREDENTIALS`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `MYSQL_URL` (or `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`)
- `PORT` (optional, defaults to 3000)

Local startup:
```bash
npm install
npm start
```

Database setup:
```bash
mysql -u USER -p DB_NAME < database/schema.sql
```

---

## 5) Verified Progress Milestones

- Google Cloud CLI configured and Vision API enabled
- Service account key created and wired
- Spotify app created and credentials configured
- Spotify query construction fixed (`URLSearchParams`)
- Spotify limit issue fixed (`limit=10`)
- OCR parsing improved for hyphenated/misordered text
- MySQL installed, schema applied, inserts verified
- Repository initialized and pushed to GitHub

---

## 6) Remaining Work for Final Closeout

### Must Complete
- Replace placeholder/test database row data with real user flow validation
- Run final regression pass with multiple album cover types
- Add/update `README.md` with exact setup + run + troubleshooting
- Capture final demo evidence (screenshots/video)
- Final cleanup pass on code comments and error messaging consistency

### Stretch / Optional
- Edit/delete entries in collection
- Search/filter collection view
- CSV/JSON export
- Production deployment hardening (secret manager for Google key JSON)

---

## 7) Final Acceptance Criteria

Project is considered final when:
- End-to-end upload -> OCR -> Spotify -> save flow works reliably
- At least 4/5 representative test images return usable matches
- Saved albums persist and load on collection page after restart
- Setup instructions allow a clean local run without guesswork
- Final submission package includes code, documentation, and demo proof

---

## 8) Risks and Mitigations

- **OCR text quality variance**  
  Mitigation: manual entry fallback + improved parsing heuristics

- **Spotify query miss / API constraints**  
  Mitigation: strict query + broad query fallback, robust error reporting

- **Environment misconfiguration**  
  Mitigation: explicit `.env` requirements and startup checks

- **Deployment secret handling**  
  Mitigation: avoid committing secrets; use platform env vars in production

