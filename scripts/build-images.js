'use strict';

// Build static site into dist, retaining original image URLs for compatibility.
// Source files are never modified. No runtime image service is required.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const pages = ['index.html','contact.html','galerij.html','klanten.html','mensen.html',
  'nieuws.html','over-ons.html','partners.html','services.html','vestiging.html'];
// Each entry is [source filename, output filename, maximum width, maximum height, logo].
const assets = [
  ['Logo alkemade website.png','alkemade-logo.webp',1000,180,true],
  ['AD Flowers.png','ad-flowers.webp',900,700,true],
  ['Basket of Flowers Logo .png','basket-of-flowers.webp',900,700,true],
  ['Funflowers Logo.png','funflowers.webp',900,700,true],
  ['Funza Logo.png','funza.webp',900,700,true],
  ['LPC Logo.png','lpc.webp',900,700,true],
  ['Logo Blooms.png','blooms.webp',900,700,true],
  ['Logo EMF.png','emf.webp',900,700,true],
  ['Logo Klaver.png','klaver.webp',900,700,true],
  ['Nakash Dror Logo.png','nakash-dror.webp',900,700,true],
  ['Uki Farm Logo .png','uki-farm.webp',900,700,true],
  ['Foto 8 .png','klanten.webp',1920,1920,false],
  ['Foto 10.png','services-10.webp',1920,1920,false],
  ['Foto 11 .png','services-11.webp',1600,1600,false],
  ['Foto 12.png','services-12.webp',1600,1600,false],
  ['Foto 13.png','services-13.webp',1600,1600,false],
  ['Foto claudia.png','claudia.webp',1000,1200,false],
  ['Foto Mike.jpg','mike.webp',1000,1200,false],
  ['foto Aleksandra.jpeg','aleksandra.webp',1000,1200,false],
  ['foto 1.jpeg','foto-1.webp',1920,1920,false],
  ['foto 2.jpeg','foto-2.webp',1920,1920,false],
  ['foto 3.jpeg','foto-3.webp',1600,1600,false],
  ['foto 5.jpeg','foto-5.webp',1600,1600,false],
  ['foto 6 .jpeg','foto-6.webp',1920,1920,false],
  ['foto 9.jpeg','foto-9.webp',1600,1600,false]
];

// Responsive candidates are generated only if they are smaller than the primary.
const widths = [240, 320, 480, 640, 768, 1024, 1440];
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const gridSizes = '(max-width: 650px) calc(100vw - 24px), (max-width: 1000px) 55vw, 430px';
const partnerSizes = '(max-width: 480px) 240px, (max-width: 768px) 350px, 400px';

function splitSizes(meta, height) {
  // object-fit: cover can require more source pixels than the visible box width.
  const cover = Math.ceil(height * meta.width / meta.height);
  return '(max-width: 1024px) max(calc(100vw - 48px), ' + cover + 'px), ' +
    Math.max(528, cover) + 'px';
}

function policy(page, tag, src, index, meta) {
  if (tag.includes('class="logo-img"')) return {loading:'eager',sizes:'201px'};
  if (tag.includes('class="footer-logo-img"')) return {loading:'lazy',sizes:'167px'};
  if (page === 'index.html' && src === 'images/foto 5.jpeg')
    return {loading:'eager',high:true,hero:true,sizes:Math.ceil(500 * Math.max(1,meta.width/meta.height))+'px'};
  if (page === 'index.html') return {loading:'lazy',sizes:splitSizes(meta,500)};
  if (page === 'klanten.html' || (page === 'services.html' && src === 'images/Foto 10.png'))
    return {loading:'eager',high:true,sizes:splitSizes(meta,400)};
  if (page === 'over-ons.html') return {loading:index===1?'eager':'lazy',high:index===1,sizes:splitSizes(meta,500)};
  if (page === 'partners.html') {
    if (src === 'images/foto 9.jpeg') return {loading:'lazy',sizes:splitSizes(meta,500)};
    return {loading:index<=2?'eager':'lazy',sizes:partnerSizes};
  }
  if (page === 'mensen.html') return {loading:index<=3?'eager':'lazy',sizes:gridSizes};
  if (page === 'nieuws.html') return {loading:index===1?'eager':'lazy',high:index===1};
  return {loading:'lazy',sizes:gridSizes};
}

function withAttr(tag, name, value) {
  // Preserve author-provided dimensions and other explicit attributes.
  if (new RegExp('\\s'+name+'\\s*=', 'i').test(tag)) return tag;
  return tag.replace(/>$/, ' '+name+'="'+value+'">');
}

function responsiveMarkup(page, html, images) {
  let index = 0;
  const stats = {eager:0,lazy:0,responsive:0,dimensions:0,high:0,hero:0};
  const result = html.replace(/<img\b[^>]*>/gi, original => {
    const match = original.match(/\bsrc="([^"]+)"/i);
    if (!match) throw new Error('Missing image src in '+page);
    const src = match[1];
    const meta = images.get(src);
    if (src.startsWith('images/') && !meta) throw new Error('Missing image metadata: '+src);
    const plan = policy(page,original,src,index++,meta);
    let tag = withAttr(original,'loading',plan.loading);
    stats[plan.loading]++;
    if (plan.loading==='lazy') tag=withAttr(tag,'decoding','async');
    if (plan.high) { tag=withAttr(tag,'fetchpriority','high'); stats.high++; }
    if (meta) {
      tag=tag.replace('src="'+src+'"','src="'+meta.url+'"');
      tag=withAttr(tag,'width',meta.width);
      tag=withAttr(tag,'height',meta.height);
      stats.dimensions++;
      if (meta.candidates.length>1 && plan.sizes) {
        const srcset=meta.candidates.map(x=>x.url+' '+x.width+'w').join(', ');
        tag=withAttr(tag,'srcset',srcset);
        tag=withAttr(tag,'sizes',plan.sizes);
        stats.responsive++;
      }
    }
    // This image is already hidden by CSS at <= 1024px. A matching picture
    // source avoids requesting the desktop photo at all, without JavaScript.
    if (plan.hero) {
      tag='<picture><source media="(max-width: 1024px)" srcset="'+placeholder+'">'+tag+'</picture>';
      stats.hero++;
    }
    return tag;
  });
  return {html:result,stats};
}

// Publish content-addressed copies while retaining the existing unversioned URLs.
// Only fingerprinted paths receive immutable cache headers.
async function versionAssets(images) {
  const urls = new Map();
  async function version(url) {
    if (urls.has(url)) return urls.get(url);
    const filename = decodeURIComponent(url);
    const bytes = await fs.readFile(path.join(dist, filename));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0,24);
    const target = 'assets/'+hash+'/'+path.basename(filename);
    await fs.mkdir(path.join(dist,'assets',hash),{recursive:true});
    await fs.writeFile(path.join(dist,target),bytes);
    const encoded = '/'+target.split('/').map(encodeURIComponent).join('/');
    urls.set(url,encoded);
    return encoded;
  }
  for (const url of ['css/style.css','js/main.js','js/search.js']) await version(url);
  for (const meta of images.values()) {
    meta.url = await version(meta.url);
    for (const candidate of meta.candidates) candidate.url = await version(candidate.url);
  }
  return urls;
}

function optimizeDocument(html, urls) {
  // Playfair Display was only declared in an unused custom property.
  // Preserve the exact existing weights, styles and swap strategy of used fonts.
  html = html.replace('&family=Playfair+Display:wght@400;500;600','');
  html = html.replace('href="css/style.css"','href="'+urls.get('css/style.css')+'"');
  // Keep scripts at their existing locations, preserving initialization order
  // including page-specific inline contact/news handlers.
  for (const url of ['js/main.js','js/search.js']) {
    html = html.replace('src="'+url+'"','src="'+urls.get(url)+'"');
  }
  return html;
}

async function main() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(path.join(dist, 'images', 'optimized'), { recursive: true });
  for (const dir of ['css','js','images']) {
    await fs.cp(path.join(root,dir), path.join(dist,dir), {
      recursive: true, filter: source => !['.DS_Store','optimized'].includes(path.basename(source))
    });
  }
  const images = new Map();
  let before = 0, after = 0, variants = 0;
  for (const [filename,output,width,height,logo] of assets) {
    const source = path.join(root,'images',filename);
    const original = await fs.stat(source);
    const metadata = await sharp(source).metadata();
    const options = logo ? {lossless:true,effort:5} : {quality:88,alphaQuality:100,effort:5};
    const {data,info} = await sharp(source).rotate()
      .resize({width,height,fit:'inside',withoutEnlargement:true})
      .webp(options).toBuffer({resolveWithObject:true});
    const smaller = data.length < original.size;
    const primaryUrl = smaller ? 'images/optimized/'+output : 'images/'+encodeURIComponent(filename);
    if (smaller) await fs.writeFile(path.join(dist,'images','optimized',output),data);
    const swapped = [5,6,7,8].includes(metadata.orientation);
    const w = smaller ? info.width : swapped ? metadata.height : metadata.width;
    const h = smaller ? info.height : swapped ? metadata.width : metadata.height;
    const bytes = smaller ? data.length : original.size;
    const candidates = [];
    for (const candidateWidth of widths) {
      if (candidateWidth >= w || candidateWidth < (logo?240:480)) continue;
      const variant = await sharp(source).rotate()
        .resize({width:candidateWidth,withoutEnlargement:true})
        .webp(options).toBuffer({resolveWithObject:true});
      if (variant.data.length >= bytes || variant.info.width >= w) continue;
      const name=output.replace(/\.webp$/, '-'+variant.info.width+'w.webp');
      await fs.writeFile(path.join(dist,'images','optimized',name),variant.data);
      candidates.push({url:'images/optimized/'+name,width:variant.info.width,bytes:variant.data.length});
      variants++;
    }
    candidates.push({url:primaryUrl,width:w,bytes});
    images.set('images/'+filename,{url:primaryUrl,width:w,height:h,candidates});
    before+=original.size; after+=bytes;
    console.log(JSON.stringify({kind:'image',filename,output:primaryUrl,originalBytes:original.size,
      servedBytes:bytes,width:w,height:h,variants:candidates}));
  }
  // The recently updated Hogewoning Flowers logo is already only ~4.8 KB.
  // Keep it byte-for-byte unchanged, including its original accessible name/link.
  const partner='images/hogewoning-flowers.webp';
  const pm=await sharp(path.join(root,partner)).metadata();
  const pb=(await fs.stat(path.join(root,partner))).size;
  images.set(partner,{url:partner,width:pm.width,height:pm.height,candidates:[{url:partner,width:pm.width,bytes:pb}]});
  before+=pb; after+=pb;
  const urls = await versionAssets(images);
  for (const page of pages) {
    const html=await fs.readFile(path.join(root,page),'utf8');
    const rendered=responsiveMarkup(page,html,images);
    await fs.writeFile(path.join(dist,page),optimizeDocument(rendered.html,urls));
    console.log(JSON.stringify({kind:'page',page,...rendered.stats}));
  }
  console.log(JSON.stringify({kind:'summary',originalBytes:before,servedBytes:after,
    responsiveVariants:variants,localAssets:images.size,versionedAssets:urls.size}));
}
main().catch(error => { console.error('Image build failed:', error.message); process.exitCode=1; });
