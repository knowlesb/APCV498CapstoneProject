require('./config/env');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/search', require('./routes/search'));
app.use('/api/albums', require('./routes/albums'));

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/collection', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/collection.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

