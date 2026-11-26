'use strict';

const {siteOrigin,pages,canonicalPath}=require('./seo');
const metadata = {
  "index.html": [
    "Bloemenverwerking & logistiek | Alkemade International",
    "Alkemade International in Aalsmeer ondersteunt kwekers met verwerking, veilingvoorbereiding, kwaliteitsfeedback, verkoopondersteuning en bloemenlogistiek.",
    "Home",
    "WebPage"
  ],
  "over-ons.html": [
    "Over Alkemade International | Bloemenservice sinds 1997",
    "Leer Alkemade International B.V. kennen: sinds 1997 actief in verwerking, marketing en logistiek van verse snijbloemen, gevestigd bij Royal FloraHolland.",
    "Over ons",
    "AboutPage"
  ],
  "services.html": [
    "Bloemenverwerking & veilingvoorbereiding | Alkemade",
    "Ontdek onze diensten voor kwekers: snijbloemen uitpakken en verwerken, veilingklaar maken, kwaliteitscontrole en verwerking van mono bossen en boeketten.",
    "Diensten",
    "WebPage"
  ],
  "partners.html": [
    "Samenwerking met bloemenkwekers | Alkemade International",
    "Maak kennis met onze internationale samenwerkingspartners en ontdek hoe Alkemade kwekers ondersteunt met een compleet dienstenpakket voor de bloemenketen.",
    "Partners",
    "WebPage"
  ],
  "klanten.html": [
    "Diensten voor kwekers & bloemenhandel | Alkemade",
    "Alkemade werkt met lokale en internationale kwekers en handelaren. Ontdek onze persoonlijke service en ondersteuning in de internationale bloemenketen.",
    "Klanten",
    "WebPage"
  ],
  "mensen.html": [
    "Ons team in Aalsmeer | Alkemade International",
    "Ontmoet het team van Alkemade International in Aalsmeer en vind de contactgegevens voor accountmanagement en logistieke dienstverlening.",
    "Mensen",
    "WebPage"
  ],
  "vestiging.html": [
    "Vestiging bij Royal FloraHolland Aalsmeer | Alkemade",
    "Bezoek Alkemade International bij Royal FloraHolland aan de Legmeerdijk 313 in Aalsmeer. Bekijk het bezoekadres, postadres en contactgegevens.",
    "Vestiging",
    "ContactPage"
  ],
  "galerij.html": [
    "Galerij: bloemen en sierteelt | Alkemade International",
    "Bekijk sfeerbeelden van bloemen en de werkomgeving in de sierteelt, en vind informatie over onze vestiging bij FloraHolland Aalsmeer.",
    "Galerij",
    "CollectionPage"
  ],
  "nieuws.html": [
    "Nieuws uit de sierteelt | Alkemade International",
    "Lees het bedrijfsnieuws van Alkemade International, waaronder de uitbreiding van onze dienstverlening met mono bossen en bandboeketten.",
    "Nieuws",
    "CollectionPage"
  ],
  "contact.html": [
    "Contact Alkemade International | Aalsmeer",
    "Neem contact op met Alkemade International B.V. in Aalsmeer voor vragen over bloemenverwerking, logistiek of samenwerking. Bel of stuur een bericht.",
    "Contact",
    "ContactPage"
  ]
};
const brand='Alkemade International B.V.';
const escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const galleryChildren=new Set(['services.html','klanten.html','mensen.html','vestiging.html']);

function structuredData(page) {
  const [title,description,label,type]=metadata[page];
  const url=siteOrigin+canonicalPath(page);
  const orgId=siteOrigin+'/#organization',siteId=siteOrigin+'/#website';
  const org={'@type':'Organization','@id':orgId,name:brand,url:siteOrigin+'/',
    logo:{'@type':'ImageObject',url:siteOrigin+'/logo.png',width:512,height:512},
    foundingDate:'1997',telephone:'+31-297-567148',email:'alkemade@nl-alkemade.com',
    address:{'@type':'PostalAddress',streetAddress:'Legmeerdijk 313',postalCode:'1431 GB',
      addressLocality:'Aalsmeer',addressCountry:'NL'}};
  const website={'@type':'WebSite','@id':siteId,url:siteOrigin+'/',name:'Alkemade International',publisher:{'@id':orgId},inLanguage:'nl'};
  const webPage={'@type':type,'@id':url+'#webpage',url,name:title,description,inLanguage:'nl',isPartOf:{'@id':siteId},about:{'@id':orgId}};
  const graph=[org,website,webPage];
  if(page!=='index.html'){
    const crumbs=[['Home',siteOrigin+'/']];
    if(galleryChildren.has(page)) crumbs.push(['Galerij',siteOrigin+'/galerij.html']);
    crumbs.push([label,url]);
    const id=url+'#breadcrumb';
    webPage.breadcrumb={'@id':id};
    graph.push({'@type':'BreadcrumbList','@id':id,itemListElement:crumbs.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))});
  }
  return {'@context':'https://schema.org','@graph':graph};
}

function onPage(page,html) {
  if(!metadata[page]||!pages.includes(page)) throw Error('Missing metadata: '+page);
  const [title,description]=metadata[page],url=siteOrigin+canonicalPath(page);
  if((html.match(/<title>[\s\S]*?<\/title>/g)||[]).length!==1) throw Error('Expected one title: '+page);
  if((html.match(/<meta name="description" content="[^"]*">/g)||[]).length!==1) throw Error('Expected one description: '+page);
  html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escapeHtml(title)+'</title>')
    .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escapeHtml(description)+'">');
  const tags=[
    ['og:type','website'],['og:site_name','Alkemade International'],['og:title',title],['og:description',description],['og:url',url],['og:locale','nl_NL'],
    ['og:image',siteOrigin+'/social-card.jpg'],['og:image:width','1200'],['og:image:height','630'],['og:image:alt','Logo van Alkemade International B.V.']
  ].map(([property,value])=>'  <meta property="'+property+'" content="'+escapeHtml(value)+'">').join('\n');
  const twitter=[['twitter:card','summary_large_image'],['twitter:title',title],['twitter:description',description],['twitter:image',siteOrigin+'/social-card.jpg'],['twitter:image:alt','Logo van Alkemade International B.V.']]
    .map(([name,value])=>'  <meta name="'+name+'" content="'+escapeHtml(value)+'">').join('\n');
  const schema=JSON.stringify(structuredData(page)).replace(/</g,'\\u003c');
  return html.replace('</head>',tags+'\n'+twitter+'\n  <link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">\n  <script type="application/ld+json">'+schema+'</script>\n</head>');
}

// Only describe what existing image labels actually establish; do not assert that
// stock images depict Alkemade employees, offices or customers.
const altMap={
  'Alkemade International B.V.':'Logo Alkemade International B.V.',
  'Verse bloemen':'Verse snijbloemen',
  'Bloemen verwerking':'Bloemenverwerking',
  'Alkemade Flowers':'Sfeerbeeld bij Alkemade International',
  'Onze diensten':'Sfeerbeeld van bloemen en dienstverlening',
  'Klanten':'Sfeerbeeld bij dienstverlening aan klanten',
  'Partnerschap':'Sfeerbeeld bij samenwerking met kwekers',
  'Kantoor':'Sfeerbeeld van een kantoor',
  'Gebouw':'Sfeerbeeld van een gebouw',
  'Werkruimte':'Sfeerbeeld van een werkruimte',
  'Team':'Sfeerbeeld van een team',
  'Medewerkers':'Sfeerbeeld van medewerkers',
  'Teamwork':'Sfeerbeeld van samenwerking',
  'Tulpen':'Tulpen',
  'Rozen':'Rozen',
  'Bloemen':'Bloemen',
  'Exotisch':'Exotische bloemen',
  'Klant':'Sfeerbeeld van klantcontact',
  'Winkel':'Sfeerbeeld van een winkel',
  'Nieuws':'Sfeerbeeld van bloemen bij het nieuwsbericht'
};
function improveContent(page,html) {
  // Promote content headings from H4 to H3, preserving CSS typography.
  html=html.replace(/<h4(\s+data-i18n="(?:services\.(?:card\.)?[^"]+\.title|clients\.(?:global|stats|service)\.title|location\.(?:visit|postal|contact)\.title|contact\.(?:visit\.nl|postal|phone\.nl))"[^>]*)>([\s\S]*?)<\/h4>/g,
    '<h3 class="heading-h4"$1>$2</h3>');
  // Contact's top-level sections should be H2, not H3; retain H3 typography.
  if(page==='contact.html') html=html.replace(/<h3([^>]*data-i18n="contact\.(?:form\.title|success\.title|title)"[^>]*)>([\s\S]*?)<\/h3>/g,'<h2 class="heading-h3"$1>$2</h2>');
  // Footer column labels are not content subsections.
  html=html.replace(/<h4 class="footer-title" data-i18n="footer\.gallery">Galerij<\/h4>/g,
    '<p class="footer-title"><a href="galerij.html" data-i18n="footer.gallery">Galerij</a></p>');
  html=html.replace(/<h4 class="footer-title"([^>]*)>([\s\S]*?)<\/h4>/g,'<p class="footer-title"$1>$2</p>');
  if(galleryChildren.has(page)) html=html.replace('<span data-i18n="page.gallery">Galerij</span>','<a href="galerij.html" class="breadcrumb-gallery" data-i18n="page.gallery">Galerij</a>');
  if(page==='klanten.html') html=html.replace('<h2 class="section-title" data-i18n="clients.title"></h2>','<h2 class="section-title" data-i18n="clients.title">Tevreden klanten wereldwijd</h2>');
  // Keep the brand slogan and visible navigation labels intact.
  return html.replace(/<img\b[^>]*>/gi,tag=>tag.replace(/\balt="([^"]*)"/,(match,alt)=>{
    if(Object.hasOwn(altMap,alt)) return 'alt="'+escapeHtml(altMap[alt])+'"';
    return match;
  }));
}
module.exports={metadata,onPage,improveContent,structuredData};
