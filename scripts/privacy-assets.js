'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const {createHash}=require('node:crypto');

// Existing directly embedded image URLs only. No Unsplash API or runtime proxy.
// Downloads occur at build time, never in the visitor's browser.
const stockUrls=[
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&q=80",
  "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&q=80",
  "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80",
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80"
];
const fontSpecs=[
  ['cormorant-garamond',['300','400','500','400-italic']],
  ['source-sans-3',['300','400','500','600','700']]
];
async function prepareFonts(root,dist,version) {
  let css='';
  await fs.mkdir(path.join(dist,'fonts'),{recursive:true});
  for(const [family,weights] of fontSpecs) {
    const dir=path.join(root,'node_modules','@fontsource',family);
    const license=await fs.readFile(path.join(dir,'LICENSE'));
    await fs.writeFile(path.join(dist,'fonts',family+'-LICENSE.txt'),license);
    for(const weight of weights) {
      // Preserve Fontsource's unicode ranges, family, weight, style and swap.
      let sheet=await fs.readFile(path.join(dir,weight+'.css'),'utf8');
      const files=[...new Set([...sheet.matchAll(/url\((?:['"])?\.\/files\/([^)'"]+)(?:['"])?\)/g)].map(m=>m[1]))];
      if(!files.length) throw Error('Missing local font references: '+family+' '+weight);
      for(const file of files) {
        if(!/^[a-z0-9-]+\.(woff2?|ttf)$/i.test(file)) throw Error('Unexpected font name');
        const target='fonts/'+file;
        await fs.copyFile(path.join(dir,'files',file),path.join(dist,target));
        const url=await version(target);
        sheet=sheet.replaceAll('./files/'+file,url);
      }
      if(/url\(\s*['"]?(?:https?:|\.\/)/i.test(sheet)) throw Error('Nonlocal font URL');
      css+=sheet+'\n';
    }
  }
  const stylePath=path.join(dist,'css','style.css');
  await fs.writeFile(stylePath,css+'\n'+await fs.readFile(stylePath,'utf8'));
}

async function downloadStock(url) {
  const u=new URL(url);
  if(u.origin!=='https://images.unsplash.com'||!/^\/photo-[0-9a-f-]+$/.test(u.pathname)) throw Error('Unexpected stock URL');
  let error;
  for(let n=0;n<3;n++) {
    try {
      const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'image/jpeg,image/webp,image/png'}});
      if(!response.ok||!/^image\/(?:jpeg|png|webp)(?:;|$)/i.test(response.headers.get('content-type')||'')) throw Error('Image fetch HTTP '+response.status);
      const reader=response.body.getReader(), chunks=[];
      let size=0;
      try {
        for(;;) {
          const {done,value}=await reader.read();
          if(done)break;
          size+=value.byteLength;
          if(size>4*1024*1024)throw Error('Stock image too large');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel().catch(()=>{}); }
      return Buffer.concat(chunks);
    } catch(e) { error=e; }
  }
  throw Error('Unable to localize '+u.pathname+': '+error.message);
}
async function prepareStock(dist,images) {
  // A failed download fails the build; never fall back to a third-party URL.
  let before=0,after=0;
  for(let offset=0;offset<stockUrls.length;offset+=4) {
    const batch=await Promise.all(stockUrls.slice(offset,offset+4).map(async url=>{
      const source=await downloadStock(url);
      const meta=await sharp(source,{limitInputPixels:16000000}).metadata();
      if(!['jpeg','png','webp'].includes(meta.format)||!meta.width||!meta.height) throw Error('Invalid image');
      const maxWidth=Number(new URL(url).searchParams.get('w'));
      const {data,info}=await sharp(source,{limitInputPixels:16000000}).rotate().resize({width:maxWidth,withoutEnlargement:true}).webp({quality:88,effort:5}).toBuffer({resolveWithObject:true});
      const useOriginal=data.length>=source.length&&meta.width<=maxWidth&&(!meta.orientation||meta.orientation===1);
      const bytes=useOriginal?source:data;
      const ext=useOriginal?(meta.format==='jpeg'?'jpg':meta.format):'webp';
      const name='stock-'+createHash('sha256').update(url).digest('hex').slice(0,16)+'.'+ext;
      const local='images/optimized/'+name;
      await fs.writeFile(path.join(dist,local),bytes);
      const width=useOriginal?meta.width:info.width,height=useOriginal?meta.height:info.height;
      return {url,local,width,height,originalBytes:source.length,bytes:bytes.length};
    }));
    for(const item of batch) {
      images.set(item.url,{url:item.local,width:item.width,height:item.height,candidates:[{url:item.local,width:item.width,bytes:item.bytes}]});
      before+=item.originalBytes;after+=item.bytes;
      console.log(JSON.stringify({kind:'stock-image',...item}));
    }
  }
  return {before,after,count:stockUrls.length};
}
const copy={
  nl:{heading:'Bekijk onze locatie',note:'Google Maps is uitgeschakeld. Als u de kaart laadt, ontvangt Google technische gegevens zoals uw IP-adres en kan Google cookies of vergelijkbare technieken gebruiken.',load:'Google Maps laden',hide:'Kaart sluiten (toestemming intrekken)',title:'Google Maps – Alkemade International',policy:'Privacybeleid van Google'},
  en:{heading:'View our location',note:'Google Maps is disabled. If you load the map, Google receives technical data such as your IP address and may use cookies or similar technologies.',load:'Load Google Maps',hide:'Close map (withdraw consent)',title:'Google Maps – Alkemade International',policy:'Google Privacy Policy'},
  es:{heading:'Vea nuestra ubicación',note:'Google Maps está desactivado. Si carga el mapa, Google recibe datos técnicos, como su dirección IP, y puede utilizar cookies o tecnologías similares.',load:'Cargar Google Maps',hide:'Cerrar mapa (retirar consentimiento)',title:'Google Maps – Alkemade International',policy:'Política de privacidad de Google'}
};
function protectDocument(page,html,lang) {
  const t=copy[lang];
  if(!t)throw Error('Unknown language');
  // Replace rather than conceal the iframe: no src, preload or third-party
  // request until the visitor activates the button. The address and original
  // external directions link remain outside this component.
  html=html.replace(/<iframe\b[\s\S]*?<\/iframe>/gi,tag=>{
    const url=tag.match(/\bsrc="([^"]+)"/)?.[1];
    if(!url||!url.startsWith('https://www.google.com/maps/embed?'))throw Error('Unexpected iframe on '+page);
    return '<div class="map-consent" data-map-url="'+url+'" data-map-title="'+t.title+'">'+
      '<div class="map-consent-placeholder"><svg aria-hidden="true" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'+
      '<h3>'+t.heading+'</h3><p>Legmeerdijk 313, 1431 GB Aalsmeer</p><p>'+t.note+'</p>'+
      '<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">'+t.policy+'</a>'+
      '<button type="button" class="btn btn-primary map-consent-load">'+t.load+'</button></div>'+
      '<div class="map-consent-frame" hidden></div><button type="button" class="btn map-consent-hide" hidden>'+t.hide+'</button></div>';
  });
  // External navigation remains explicit and does not send the referring URL.
  return html.replace(/<a\b[^>]*target="_blank"[^>]*>/gi,tag=>/\brel=/.test(tag)?tag:tag.replace(/>$/,' rel="noopener noreferrer">'));
}
function removeExternalFonts(html) {
  return html.replace(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>\s*/gi,'');
}
function assertPrivateMarkup(page,html) {
  if(/<iframe\b/i.test(html)||/<(?:img|link|script)\b[^>]*(?:src|href)="https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com)/i.test(html))throw Error('Unexpected external resource on '+page);
}
module.exports={prepareFonts,prepareStock,protectDocument,removeExternalFonts,assertPrivateMarkup,stockUrls};
