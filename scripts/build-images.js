'use strict';

// Build static site into dist, retaining original image URLs for compatibility.
// Source files are never modified. No runtime image service is required.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
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
  ['Logo JP Hogewoning.png','jp-hogewoning.webp',900,700,true],
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

async function main() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(path.join(dist, 'images', 'optimized'), { recursive: true });
  for (const dir of ['css','js','images']) {
    await fs.cp(path.join(root,dir), path.join(dist,dir), {
      recursive: true, filter: source => !['.DS_Store','optimized'].includes(path.basename(source))
    });
  }
  const replacements = new Map();
  let before = 0, after = 0;
  for (const [filename,output,width,height,logo] of assets) {
    const source = path.join(root,'images',filename);
    const original = await fs.stat(source);
    const metadata = await sharp(source).metadata();
    const {data,info} = await sharp(source)
      .rotate()
      .resize({width,height,fit:'inside',withoutEnlargement:true})
      .webp(logo ? {lossless:true,effort:5} : {quality:88,alphaQuality:100,effort:5})
      .toBuffer({resolveWithObject:true});
    // Keep original format whenever the conversion is not smaller.
    const smaller = data.length < original.size;
    if (smaller) {
      await fs.writeFile(path.join(dist,'images','optimized',output),data);
      replacements.set('images/'+filename,'images/optimized/'+output);
    }
    before += original.size;
    after += smaller ? data.length : original.size;
    console.log(JSON.stringify({kind:'image',filename,output:smaller?output:filename,
      originalBytes:original.size,servedBytes:smaller?data.length:original.size,
      originalWidth:metadata.width,originalHeight:metadata.height,
      width:smaller?info.width:metadata.width,height:smaller?info.height:metadata.height,
      alpha:!!metadata.hasAlpha,optimized:smaller}));
  }
  for (const page of pages) {
    let html = await fs.readFile(path.join(root,page),'utf8');
    let total = 0;
    for (const [source,target] of replacements) {
      const marker = 'src="'+source+'"';
      const parts = html.split(marker);
      total += parts.length-1;
      html = parts.join('src="'+target+'"');
    }
    await fs.writeFile(path.join(dist,page),html);
    console.log(JSON.stringify({kind:'page',page,replacements:total}));
  }
  console.log(JSON.stringify({kind:'summary',originalBytes:before,servedBytes:after,
    optimized:replacements.size,total:assets.length}));
}
main().catch(error => { console.error('Image build failed:', error.message); process.exitCode=1; });
