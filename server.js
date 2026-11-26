const express = require('express');
const contactHandler = require('./api/contact');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '32kb' }));
app.get('/api/contact', contactHandler);
app.post('/api/contact', contactHandler);

// Serve static files (alleen voor niet-API routes)
app.use((req, res, next) => {
  // Skip static files voor API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Fallback: serve index.html voor alle andere GET routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint niet gevonden' });
  }
  res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log("Contact email uses RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL.");
});

