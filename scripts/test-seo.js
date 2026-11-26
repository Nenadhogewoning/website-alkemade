'use strict';
const assert=require('node:assert/strict');
const {pages,canonicalPath,canonicalize,sitemap,robots,siteOrigin}=require('./seo');
assert.equal(pages.length,10);
assert.equal(new Set(pages).size,pages.length);
assert.equal(canonicalPath('index.html'),'/');
for (const p of pages) {
  const html=canonicalize(p,'<html><head></head><body><a href="index.html">Home</a></body></html>');
  assert.ok(html.includes('<link rel="canonical" href="'+siteOrigin+canonicalPath(p)+'">'));
  assert.ok(html.includes('href="/"'));
  assert.ok(sitemap().includes('<loc>'+siteOrigin+canonicalPath(p)+'</loc>'));
}
assert.equal((sitemap().match(/<loc>/g)||[]).length,10);
assert.ok(!sitemap().includes('index.html'));
assert.ok(robots().includes('Sitemap: '+siteOrigin+'/sitemap.xml'));
assert.throws(()=>canonicalPath('404.html'));
assert.throws(()=>canonicalize('index.html','<head><link rel="canonical" href="/"></head>'));
console.log('SEO unit checks passed');
