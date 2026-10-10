const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');const evidence=path.join(root,'test-results');
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'index-standalone.html')).href);await page.locator('.project-shot').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});assert.equal(await page.locator('.project-shot').count(),5);assert.equal(await page.locator('#contactForm [type="submit"]').isEnabled(),true);assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:4173');await page.screenshot({path:path.join(evidence,'desktop-hero-final.png')});
 const headers=(await page.request.get('http://127.0.0.1:4173')).headers();assert.ok(headers['content-security-policy'].includes("form-action 'none'"));assert.equal(headers['x-content-type-options'],'nosniff');
 const documentText=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');assert.ok(documentText.includes('noindex, nofollow'));assert.ok(!/rel="canonical"/.test(documentText));assert.ok(!fs.existsSync(path.join(root,'dist/sitemap.xml')));
 const publishedFiles=['index.html','assets/site.css','assets/site.js','404.html'];const suspicious=[];
 for(const file of publishedFiles){const text=fs.readFileSync(path.join(root,'dist',file),'utf8');if(/(?:AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sk_live_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{30,})/.test(text))suspicious.push(file);}
 assert.deepEqual(suspicious,[]);
 const result={standalone:{imagesDecoded:5,runtimeErrors:errors,formEnabled:true},preview:{noindex:true,noGuessedCanonical:true,noSitemap:true,securityHeaders:headers},secretPatternScan:{files:publishedFiles,matches:suspicious,note:'Pattern scan and code inspection, not an exhaustive secret-scanner guarantee.'}};
 fs.writeFileSync(path.join(evidence,'release-check.json'),JSON.stringify(result,null,2));await browser.close();console.log('PASS: offline standalone, output headers, no guessed domain, preview indexing guard and secret-pattern scan.');
})().catch(e=>{console.error(e);process.exitCode=1;});
