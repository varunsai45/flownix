const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {HtmlValidate}=require('html-validate');
const {transform}=require('lightningcss');
const root=path.resolve(__dirname,'..');
(async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'assets/site.css'),'utf8');
 const validator=new HtmlValidate({extends:['html-validate:recommended'],rules:{'no-inline-style':'off','long-title':'off','prefer-native-element':'off','require-sri':'off','svg-focusable':'off','wcag/h32':'off'}});
 let failures=0;
 for(const file of ['index.html','404.html','privacy.html','terms.html']){
   const result=await validator.validateFile(path.join(root,file));
   for(const r of result.results)for(const m of r.messages)console.log(`${file}:${m.line}:${m.column} ${m.ruleId} ${m.message}`);
   failures+=result.errorCount;
 }
 transform({filename:'assets/site.css',code:Buffer.from(css),errorRecovery:false});
 for(const hex of css.match(/#[\da-f]{3,8}\b/gi)||[])assert.match(hex,/^#(?:0b0d0b|78d641|f3f5f0)(?:[\da-f]{2})?$/i);
 for(const rgba of css.matchAll(/rgba\((\d+),(\d+),(\d+),/g))assert.ok(['11,13,11','120,214,65','243,245,240'].includes(rgba.slice(1).join(',')));
 for(const match of html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])),`Missing ${match[1]}`);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 const ids=[...html.matchAll(/\bid="([^\"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs');
 for(const m of html.matchAll(/href="#([^\"]+)"/g))assert.ok(ids.includes(m[1]),`Missing anchor ${m[1]}`);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][0].founder.name,'Varun Sai');
 assert.ok(html.includes('₹1.2 crore reported potential revenue'));assert.ok(html.includes('₹3.4 crore reported potential revenue'));
 assert.ok(!html.includes('revenue reported'));
 assert.equal((html.match(/class="project-shot"/g)||[]).length,5);
 if(failures)throw Error(`${failures} HTML validation errors`);
 console.log('PASS: HTML validation, CSS parser, brand colour literals, local references, unique IDs, anchors, heading count, business schema and campaign wording.');
})().catch(error=>{console.error(error);process.exitCode=1;});
