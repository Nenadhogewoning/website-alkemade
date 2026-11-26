'use strict';
const {languages,pages,canonicalPath}=require('./seo');
const translations=require('../js/main');
const {privacyContent,contactNotice}=require('./privacy-content');
const extra={
  "Geïntegreerde webgebaseerde software": [
    "Integrated web-based software",
    "Software integrado basado en web"
  ],
  "Goed beheerde koelketen": [
    "Well-managed cold chain",
    "Cadena de frío bien gestionada"
  ],
  "Kwaliteitsfeedback en marktinformatie": [
    "Quality feedback and market information",
    "Información sobre calidad y mercado"
  ],
  "Nauwe afstemming met partners": [
    "Close coordination with partners",
    "Estrecha coordinación con socios"
  ],
  "Boeketten en mono bunches voor supermarkten": [
    "Bouquets and mono bunches for supermarkets",
    "Ramos y ramos monovarietales para supermercados"
  ],
  "Boeketten en mono boeketten voor supermarkten": [
    "Bouquets and mono bunches for supermarkets",
    "Ramos y ramos monovarietales para supermercados"
  ],
  "Sinds 1997": [
    "Since 1997",
    "Desde 1997"
  ],
  "Ons kantoor": [
    "Our office",
    "Nuestra oficina"
  ],
  "Werkruimte": [
    "Workspace",
    "Espacio de trabajo"
  ],
  "Ons team": [
    "Our team",
    "Nuestro equipo"
  ],
  "Medewerkers": [
    "Staff",
    "Personal"
  ],
  "Samenwerking": [
    "Collaboration",
    "Colaboración"
  ],
  "Verse tulpen": [
    "Fresh tulips",
    "Tulipanes frescos"
  ],
  "Premium rozen": [
    "Premium roses",
    "Rosas de primera calidad"
  ],
  "Verse snijbloemen": ["Fresh cut flowers","Flores cortadas frescas"],
  "Gemengde boeketten": [
    "Mixed bouquets",
    "Ramos mixtos"
  ],
  "Exotische bloemen": [
    "Exotic flowers",
    "Flores exóticas"
  ],
  "Tevreden klanten": [
    "Satisfied clients",
    "Clientes satisfechos"
  ],
  "Bloemenwinkel": [
    "Flower shop",
    "Floristería"
  ]
};
const alt={
  "Logo Alkemade International B.V.": [
    "Alkemade International B.V. logo",
    "Logotipo de Alkemade International B.V."
  ],
  "Verse snijbloemen": [
    "Fresh cut flowers",
    "Flores cortadas frescas"
  ],
  "Bloemenverwerking": [
    "Flower handling",
    "Procesamiento de flores"
  ],
  "Sfeerbeeld bij Alkemade International": [
    "Illustrative image for Alkemade International",
    "Imagen ilustrativa de Alkemade International"
  ],
  "Sfeerbeeld van bloemen en dienstverlening": [
    "Illustrative image of flowers and services",
    "Imagen ilustrativa de flores y servicios"
  ],
  "Sfeerbeeld bij dienstverlening aan klanten": [
    "Illustrative image of customer services",
    "Imagen ilustrativa de atención al cliente"
  ],
  "Sfeerbeeld bij samenwerking met kwekers": [
    "Illustrative image of grower partnerships",
    "Imagen ilustrativa de colaboración con productores"
  ],
  "Sfeerbeeld van een kantoor": [
    "Illustrative office image",
    "Imagen ilustrativa de una oficina"
  ],
  "Sfeerbeeld van een gebouw": [
    "Illustrative building image",
    "Imagen ilustrativa de un edificio"
  ],
  "Sfeerbeeld van een werkruimte": [
    "Illustrative workspace image",
    "Imagen ilustrativa de un espacio de trabajo"
  ],
  "Sfeerbeeld van een team": [
    "Illustrative team image",
    "Imagen ilustrativa de un equipo"
  ],
  "Sfeerbeeld van medewerkers": [
    "Illustrative staff image",
    "Imagen ilustrativa de personal"
  ],
  "Sfeerbeeld van samenwerking": [
    "Illustrative collaboration image",
    "Imagen ilustrativa de colaboración"
  ],
  "Tulpen": [
    "Tulips",
    "Tulipanes"
  ],
  "Rozen": [
    "Roses",
    "Rosas"
  ],
  "Bloemen": [
    "Flowers",
    "Flores"
  ],
  "Exotische bloemen": [
    "Exotic flowers",
    "Flores exóticas"
  ],
  "Sfeerbeeld van klantcontact": [
    "Illustrative customer contact image",
    "Imagen ilustrativa de atención al cliente"
  ],
  "Sfeerbeeld van een winkel": [
    "Illustrative shop image",
    "Imagen ilustrativa de una tienda"
  ],
  "Sfeerbeeld van bloemen bij het nieuwsbericht": [
    "Illustrative flower image accompanying the news",
    "Imagen ilustrativa de flores para la noticia"
  ]
};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function trustedTranslation(key,lang) {
  const value=translations[lang][key];
  if(typeof value!=='string'||!value) throw Error('Missing translation '+lang+': '+key);
  if(key==='hero.title') return esc(value).replace(/&lt;(\/?span)&gt;/g,'<$1>');
  if(key==='clients.stats.text') return esc(value).replace(/&lt;br&gt;/g,'<br>');
  return esc(value);
}
function localizeDocument(page,html,lang) {
  if(!languages.includes(lang)||!pages.includes(page)) throw Error('Invalid language/page');
  html=html.replace('<html lang="nl">','<html lang="'+lang+'" data-static-language="'+lang+'">');
  let translated=0;
  // Insert localized legal content before rewriting internal links.
  html=html.replace(/<a href="#" data-i18n="footer\.privacy">/g,'<a href="privacy.html" data-i18n="footer.privacy">');
  if(page==='privacy.html'&&html.includes('<!-- PRIVACY_CONTENT -->'))html=html.replace('<!-- PRIVACY_CONTENT -->',privacyContent(lang));
  if(page==='contact.html'&&html.includes('<!-- CONTACT_PRIVACY_NOTICE -->'))html=html.replace('<!-- CONTACT_PRIVACY_NOTICE -->',contactNotice(lang));
  const expected=(html.match(/\bdata-i18n="/g)||[]).length;
  html=html.replace(/<([a-z][a-z0-9]*)\b([^<>]*\bdata-i18n="([^"]+)"[^<>]*)>([\s\S]*?)<\/\1>/gi,(all,tag,attrs,key,old)=>{
    translated++;
    let value=trustedTranslation(key,lang);
    if(key==='nav.gallery') {
      const svg=old.match(/<svg\b[\s\S]*?<\/svg>/i);
      if(svg) value+=' '+svg[0];
    }
    return '<'+tag+attrs+'>'+value+'</'+tag+'>';
  });
  if(translated!==expected) throw Error('Unrendered translations '+page+' '+lang+': '+translated+'/'+expected);
  if(lang!=='nl'){
    const i=lang==='en'?0:1;
    html=html.replace(/<span([^<>]*)>([^<>]+)<\/span>/g,(all,attrs,value)=>Object.hasOwn(extra,value)?'<span'+attrs+'>'+esc(extra[value][i])+'</span>':all);
    html=html.replace(/<img\b[^>]*>/gi,tag=>tag.replace(/\balt="([^"]*)"/,(all,value)=>Object.hasOwn(alt,value)?'alt="'+esc(alt[value][i])+'"':all));
  }
  const country={nl:'Nederland',en:'The Netherlands',es:'Países Bajos'}[lang];
  const po={nl:'Postbus',en:'P.O. Box',es:'Apartado postal'}[lang];
  html=html.replaceAll('<br>The Netherlands','<br>'+country).replaceAll('>Postbus 1032','>'+po+' 1032');
  if(lang==='es') html=html.replaceAll('<br>Email:','<br>Correo electrónico:');
  html=html.replace(/href="([^"]+)"/g,(all,href)=>{
    const match=href.match(/^([^?#]+)([?#].*)?$/);
    if(!match) return all;
    const key=match[1]==='/'?'index.html':match[1].replace(/^\//,'');
    return pages.includes(key)?'href="'+canonicalPath(key,lang)+(match[2]||'')+'"':all;
  });
  html=html.replace(/<span class="lang-toggle-text">NL<\/span>/,'<span class="lang-toggle-text">'+lang.toUpperCase()+'</span>');
  html=html.replace(/<button class="lang-toggle">/,'<button type="button" class="lang-toggle" aria-expanded="false">');
  let switches=0;
  html=html.replace(/<button class="lang-option(?: active)?" data-lang="(nl|en|es)">([^<]*)<\/button>/g,(all,code,label)=>{
    switches++;
    return '<a class="lang-option'+(code===lang?' active':'')+'" data-lang="'+code+'" lang="'+code+'" hreflang="'+code+'" href="'+canonicalPath(page,code)+'"'+(code===lang?' aria-current="page"':'')+'>'+label+'</a>';
  });
  if(switches!==3) throw Error('Missing language links: '+page);
  const searchRoutes=Object.fromEntries(pages.map(p=>[p==='index.html'?'/':p,canonicalPath(p,lang)]));
  return html.replace('</head>','  <script type="application/json" id="localized-routes">'+JSON.stringify(searchRoutes)+'</script>\n</head>');
}
module.exports={localizeDocument,translations};
