'use strict';
const siteOrigin = 'https://alkemadeinternational.com';
const languages=Object.freeze(['nl','en','es']);
const routes=Object.freeze({
  "privacy.html": ["/privacy.html","/en/privacy/","/es/privacidad/"],
  "index.html": [
    "/",
    "/en/",
    "/es/"
  ],
  "contact.html": [
    "/contact.html",
    "/en/contact/",
    "/es/contacto/"
  ],
  "galerij.html": [
    "/galerij.html",
    "/en/gallery/",
    "/es/galeria/"
  ],
  "klanten.html": [
    "/klanten.html",
    "/en/clients/",
    "/es/clientes/"
  ],
  "mensen.html": [
    "/mensen.html",
    "/en/team/",
    "/es/equipo/"
  ],
  "nieuws.html": [
    "/nieuws.html",
    "/en/news/",
    "/es/noticias/"
  ],
  "over-ons.html": [
    "/over-ons.html",
    "/en/about/",
    "/es/nosotros/"
  ],
  "partners.html": [
    "/partners.html",
    "/en/partners/",
    "/es/socios/"
  ],
  "services.html": [
    "/services.html",
    "/en/services/",
    "/es/servicios/"
  ],
  "vestiging.html": [
    "/vestiging.html",
    "/en/location/",
    "/es/ubicacion/"
  ]
});
const pages=Object.freeze(Object.keys(routes));
function canonicalPath(page,lang='nl') {
  if(!Object.hasOwn(routes,page)||!languages.includes(lang)) throw new Error('Unknown page/language: '+page+' '+lang);
  return routes[page][languages.indexOf(lang)];
}
function outputFile(page,lang='nl') {
  return lang==='nl'?page:canonicalPath(page,lang).slice(1)+'index.html';
}
function alternates(page) {
  return [...languages,'x-default'].map(lang=>[lang,siteOrigin+canonicalPath(page,lang==='x-default'?'nl':lang)]);
}
function canonicalize(page,html,lang='nl') {
  if (/<link\b[^>]*\brel=["']canonical["']/i.test(html)) throw new Error('Duplicate canonical in '+page);
  if (!html.includes('</head>')) throw new Error('Missing head in '+page);
  const alternateTags=alternates(page).map(([code,url])=>'  <link rel="alternate" hreflang="'+code+'" href="'+url+'">').join('\n');
  return html.replace('</head>', '  <link rel="canonical" href="'+siteOrigin+canonicalPath(page,lang)+'">\n'+alternateTags+'\n</head>')
    .replace(/href="index\.html"/g, 'href="'+canonicalPath('index.html',lang)+'"');
}
function sitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    pages.flatMap(page=>languages.map(lang=>'  <url>\n    <loc>'+siteOrigin+canonicalPath(page,lang)+'</loc>\n'+
      alternates(page).map(([code,url])=>'    <xhtml:link rel="alternate" hreflang="'+code+'" href="'+url+'"/>').join('\n')+'\n  </url>')).join('\n')+
    '\n</urlset>\n';
}
function robots() {
  return 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: '+siteOrigin+'/sitemap.xml\n';
}
module.exports={siteOrigin,languages,pages,routes,canonicalPath,outputFile,alternates,canonicalize,sitemap,robots};
