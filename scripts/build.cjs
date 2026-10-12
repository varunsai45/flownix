const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'dist');
const rawOrigin = process.env.SITE_URL;
if (process.argv.includes('--production') && !rawOrigin) throw Error('SITE_URL is required. Set it to your purchased, confirmed HTTPS domain before production build.');
let origin;
if (rawOrigin) {
  const url = new URL(rawOrigin);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !url.hostname.includes('.') || /(?:localhost|example\.(?:com|org|net)|\.invalid$|\.test$|127\.0\.0\.1)/i.test(url.hostname)) throw Error('SITE_URL must be your confirmed HTTPS origin, with no path, query, credentials or placeholder domain.');
  origin = url.origin;
}
fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const {transform}=require('lightningcss');
fs.writeFileSync(path.join(out,'assets/site.css'),transform({filename:'site.css',code:fs.readFileSync(path.join(root,'assets/site.css')),minify:true}).code);
let html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const schemaMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const schema=JSON.parse(schemaMatch[1]);
if (origin) {
  for(const item of schema['@graph']) {
    if(item['@id']) item['@id']=origin+'/'+item['@id'];
    if(item.publisher) item.publisher['@id']=origin+'/#business';
    if(['ProfessionalService','WebSite'].includes(item['@type'])) item.url=origin+'/';
  }
  html=html.replace(schemaMatch[0],'<script type="application/ld+json">'+JSON.stringify(schema)+'</script>');
  html=html.replace('</head>',`<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"><meta property="og:image" content="${origin}/assets/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Flownix — websites, marketing and business automation in Bangalore"><meta name="twitter:image" content="${origin}/assets/social-card.png"><meta name="twitter:image:alt" content="Flownix — websites, marketing and business automation in Bangalore"></head>`);
  if (!fs.existsSync(path.join(root,'assets/social-card.png'))) throw Error('Missing assets/social-card.png');
  fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','privacy.html','terms.html'].map(page=>`<url><loc>${origin}/${page}</loc></url>`).join('')}</urlset>\n`);
} else {
  html=html.replace('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1','noindex, nofollow');
  // Prevent a stale sitemap surviving a switch from production to preview mode.
  fs.rmSync(path.join(out,'sitemap.xml'),{force:true});
}
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'robots.txt'),origin?`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
fs.copyFileSync(path.join(root,'404.html'),path.join(out,'404.html'));
for(const page of ['privacy.html','terms.html']){
  let legal=fs.readFileSync(path.join(root,page),'utf8');
  if(origin)legal=legal.replace('</head>',`<link rel="canonical" href="${origin}/${page}"><meta property="og:url" content="${origin}/${page}"><meta property="og:image" content="${origin}/assets/social-card.png"></head>`);
  else legal=legal.replace('content="index, follow"','content="noindex, nofollow"');
  fs.writeFileSync(path.join(out,page),legal);
}
const hash=crypto.createHash('sha256').update(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).digest('base64');
const csp=`default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`;
const headers={'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','X-Frame-Options':'DENY'};
fs.writeFileSync(path.join(out,'_headers'),'/*\n'+Object.entries(headers).map(([k,v])=>`  ${k}: ${v}`).join('\n')+'\n  Cache-Control: public, max-age=0, must-revalidate\n');
fs.writeFileSync(path.join(out,'vercel.json'),JSON.stringify({headers:[{source:'/(.*)',headers:Object.entries(headers).map(([key,value])=>({key,value}))}]},null,2));
fs.writeFileSync(path.join(out,'build-info.json'),JSON.stringify({mode:origin?'production':'preview',origin:origin||null,headers,generated:new Date().toISOString()},null,2));
let standalone=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<link rel="stylesheet" href="assets/site.css">','<style>'+fs.readFileSync(path.join(root,'assets/site.css'),'utf8')+'</style>').replace('<script src="assets/site.js" defer></script>','<script>'+fs.readFileSync(path.join(root,'assets/site.js'),'utf8')+'</script>');
standalone=standalone.replace(/src="(assets\/[^\"]+\.webp)"/g,(_,file)=>`src="data:image/webp;base64,${fs.readFileSync(path.join(root,file)).toString('base64')}"`).replace('href="assets/favicon.svg"','href="data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets/favicon.svg')).toString('base64')+'"').replace('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1','noindex, nofollow');
standalone=standalone.replace('<link rel="stylesheet" href="assets/no-js.css">','<style>'+fs.readFileSync(path.join(root,'assets/no-js.css'),'utf8')+'</style>');
fs.writeFileSync(path.join(root,'index-standalone.html'),standalone);
console.log(`Built ${origin?'production':'NON-INDEXABLE PREVIEW'} in ${out}. ${origin||'Production domain has not been configured.'}`);
