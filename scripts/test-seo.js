'use strict';
const assert=require('node:assert/strict');
const {pages,canonicalPath,canonicalize,sitemap,robots,siteOrigin}=require('./seo');
assert.equal(pages.length,11);
assert.equal(new Set(pages).size,pages.length);
assert.equal(canonicalPath('index.html'),'/');
for (const p of pages) {
  const html=canonicalize(p,'<html><head></head><body><a href="index.html">Home</a></body></html>');
  assert.ok(html.includes('<link rel="canonical" href="'+siteOrigin+canonicalPath(p)+'">'));
  assert.ok(html.includes('href="/"'));
  assert.ok(sitemap().includes('<loc>'+siteOrigin+canonicalPath(p)+'</loc>'));
}
assert.equal((sitemap().match(/<loc>/g)||[]).length,33);
assert.ok(!sitemap().includes('index.html'));
assert.ok(robots().includes('Sitemap: '+siteOrigin+'/sitemap.xml'));
assert.throws(()=>canonicalPath('404.html'));
assert.throws(()=>canonicalize('index.html','<head><link rel="canonical" href="/"></head>'));
console.log('SEO unit checks passed');

const {metadata,onPage,improveContent,structuredData}=require('./on-page-seo');
assert.equal(Object.keys(metadata).length,11);
assert.equal(new Set(Object.values(metadata).map(v=>v[0])).size,11);
assert.equal(new Set(Object.values(metadata).map(v=>v[1])).size,11);
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

const {languages,outputFile,alternates}=require('./seo');
const {localizeDocument,translations}=require('./localize');
const {pageMetadata}=require('./on-page-seo');
const allUrls=new Set();
for(const p of pages) for(const lang of languages) {
  const path=canonicalPath(p,lang);
  assert.ok(!allUrls.has(path)); allUrls.add(path);
  assert.ok(sitemap().includes('<loc>'+siteOrigin+path+'</loc>'));
  assert.equal(alternates(p).length,4);
  assert.ok(outputFile(p,lang).endsWith('.html'));
  const fixture='<html lang="nl"><head><title>Old</title><meta name="description" content="Old"></head><body><h1 data-i18n="hero.title">Old</h1><a href="contact.html">Contact</a><button class="lang-option active" data-lang="nl">Nederlands</button><button class="lang-option" data-lang="en">English</button><button class="lang-option" data-lang="es">Español</button></body></html>';
  const result=canonicalize(p,onPage(p,localizeDocument(p,fixture,lang),lang),lang);
  assert.ok(result.includes('lang="'+lang+'" data-static-language="'+lang+'"'));
  assert.ok(result.includes('href="'+canonicalPath('contact.html',lang)+'"'));
  assert.ok(result.includes('href="'+siteOrigin+path+'"'));
  assert.ok(result.includes('hreflang="x-default"'));
  assert.ok(result.includes('aria-current="page"'));
  assert.equal(structuredData(p,lang)['@graph'][2].inLanguage,lang);
  assert.equal(pageMetadata(p,lang).length,4);
}
assert.equal(allUrls.size,33);
assert.equal((sitemap().match(/<xhtml:link/g)||[]).length,132);
console.log('International SEO checks passed');

const {copy,privacyContent,contactNotice}=require('./privacy-content');
for(const lang of languages){
  const h=privacyContent(lang);
  assert.equal(copy[lang].sections.length,15);
  assert.equal((h.match(/class="privacy-section"/g)||[]).length,15);
  for(let n=1;n<=15;n++){assert.ok(h.includes('href="#privacy-'+n+'"'));assert.ok(h.includes('id="privacy-'+n+'"'));}
  for(const name of ['Vercel','Resend','Microsoft 365 / Exchange','Cloudflare Turnstile','Google Maps','alkemade@nl-alkemade.com'])assert.ok(h.includes(name));
  assert.ok(h.includes('datetime="2026-11-27"'));
  assert.ok(contactNotice(lang).includes('href="privacy.html" target="_blank" rel="noopener noreferrer"'));
  assert.ok(!/<iframe|<script|<input/i.test(h));
}
console.log('Privacy content checks passed');

// Legal wording: same structure and express rights in each language.
for (const lang of languages) {
  const h=privacyContent(lang);
  const labels={nl:['Recht op bezwaar','Uw verzoek indienen','machineleesbaar','kosteloos'],en:['Right to object','Submitting your request','machine-readable','free of charge'],es:['Derecho de oposición','Presentación de solicitudes','lectura mecánica','gratuitamente']}[lang];
  for(const label of labels) assert.ok(h.includes(label));
  assert.ok(h.includes('<h3>'+labels[0]+'</h3>'));
  assert.ok(h.includes('<h3>'+labels[1]+'</h3>'));
}
