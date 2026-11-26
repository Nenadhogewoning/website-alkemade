'use strict';
const siteOrigin = 'https://alkemadeinternational.com';
const pages = Object.freeze(['index.html','contact.html','galerij.html','klanten.html','mensen.html',
  'nieuws.html','over-ons.html','partners.html','services.html','vestiging.html']);

function canonicalPath(page) {
  if (!pages.includes(page)) throw new Error('Unknown indexable page: '+page);
  return page === 'index.html' ? '/' : '/'+page;
}
function canonicalize(page, html) {
  if (/<link\b[^>]*\brel=["']canonical["']/i.test(html)) throw new Error('Duplicate canonical in '+page);
  if (!html.includes('</head>')) throw new Error('Missing head in '+page);
  return html.replace('</head>', '  <link rel="canonical" href="'+siteOrigin+canonicalPath(page)+'">\n</head>')
    .replace(/href="index\.html"/g, 'href="/"');
}
function sitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(page => '  <url><loc>'+siteOrigin+canonicalPath(page)+'</loc></url>').join('\n') +
    '\n</urlset>\n';
}
function robots() {
  return 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: '+siteOrigin+'/sitemap.xml\n';
}
module.exports = {siteOrigin,pages,canonicalPath,canonicalize,sitemap,robots};
