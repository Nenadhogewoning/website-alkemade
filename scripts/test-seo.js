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

const {metadata,onPage,improveContent,structuredData}=require('./on-page-seo');
assert.equal(Object.keys(metadata).length,10);
assert.equal(new Set(Object.values(metadata).map(v=>v[0])).size,10);
assert.equal(new Set(Object.values(metadata).map(v=>v[1])).size,10);
for(const p of pages){
  const html=onPage(p,'<html><head><title>Old</title><meta name="description" content="Old"></head></html>');
  assert.ok(html.includes('rel="icon"'));
  assert.ok(html.includes('property="og:url" content="'+siteOrigin+canonicalPath(p)+'"'));
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(data['@graph'][2].url,siteOrigin+canonicalPath(p));
  assert.equal(data['@graph'].filter(v=>v['@type']==='BreadcrumbList').length,p==='index.html'?0:1);
  assert.equal(data['@graph'][0].name,'Alkemade International B.V.');
}
const sample=improveContent('services.html','<h4 data-i18n="services.unpack.title">Uitpakken</h4><h4 class="footer-title" data-i18n="footer.gallery">Galerij</h4><img src="test.png" alt="Verse bloemen">');
assert.ok(sample.includes('<h3 class="heading-h4"'));
assert.ok(sample.includes('href="galerij.html"'));
assert.ok(sample.includes('alt="Verse snijbloemen"'));
assert.ok(improveContent('klanten.html','<h2 class="section-title" data-i18n="clients.title"></h2>').includes('Tevreden klanten wereldwijd'));
console.log('On-page SEO checks passed');
