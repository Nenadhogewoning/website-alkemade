const express = require('express');
const contactHandler = require('./api/contact');
const path = require('path');
const { sitemap, robots, pages, languages, canonicalPath } = require('./scripts/seo');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '32kb' }));
app.get('/api/contact', contactHandler);
app.post('/api/contact', contactHandler);

// Local development mirrors production SEO endpoints and error status codes.
app.get('/index.html', (req,res) => res.redirect(308, '/'+(req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '')));
app.get('/robots.txt', (req,res) => res.type('text/plain').send(robots()));
app.get('/sitemap.xml', (req,res) => res.type('application/xml').send(sitemap()));
app.get('/404.html', (req,res) => res.status(404).sendFile(path.join(__dirname,'404.html')));
const built=path.join(__dirname,'dist');
for(const page of pages) for(const lang of languages.filter(l=>l!=='nl')) {
  const url=canonicalPath(page,lang);
  app.get(url+'index.html',(req,res)=>res.redirect(308,url));
}
app.use(express.static(fs.existsSync(path.join(built,'index.html'))?built:__dirname));
app.use((req,res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success:false, error:'API endpoint niet gevonden' });
  res.status(404).sendFile(path.join(__dirname,'404.html'));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log("Contact email uses RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL.");
});

