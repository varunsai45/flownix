const {chromium}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const evidence=path.join(root,'test-results');fs.mkdirSync(evidence,{recursive:true});
const base=process.env.TEST_URL||'http://127.0.0.1:4173';
const results=[];
async function test(name,fn){if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(e){results.push({name,status:'failed',error:e.message});console.error('FAIL',name,e.message);}}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();const errors=[];const failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));
 await page.goto(base,{waitUntil:'networkidle'});
 await test('Neutral text, lime accents and original-colour portfolio images',async()=>{
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(243, 245, 240)');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(11, 13, 11)');
  assert.equal(await page.locator('.hero .btn-primary').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(120, 214, 65)');
  assert.deepEqual(await page.locator('.project-shot').evaluateAll(imgs=>imgs.map(img=>getComputedStyle(img).filter)),Array(5).fill('none'));
 });
 await test('Five original WebP images decode and have matching live project links',async()=>{
  const expected=['https://www.casameliainternational.com/','https://www.enclosesystems.com/','https://www.adornodesigners.in/','https://www.infensol.com/','https://juggle.co.in/'];
  const images=await page.locator('.project-shot').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}return imgs.map(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight,url:img.closest('a').href}));});
  assert.equal(images.length,5);images.forEach((im,i)=>{assert.ok(im.width>0&&im.height>0);assert.equal(im.url,expected[i]);});
  return images;
 });
 await test('All internal anchor destinations exist',async()=>{assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)),[]);});
 for(const width of [1440,1024,768,390,320]) await test(`Responsive layout and accessibility at ${width}px`,async()=>{
  await page.setViewportSize({width,height:900});await page.goto(base,{waitUntil:'networkidle'});
  const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&!el.closest('.service-lane,.hero-visual,.skip-link,.brand-filter');}).map(el=>({tag:el.tagName,class:el.className})).slice(0,20)}));
  assert.ok(overflow.page<=width+1,JSON.stringify(overflow));
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  fs.writeFileSync(path.join(evidence,`axe-${width}.json`),JSON.stringify(axe.violations,null,2));
  assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  await page.locator('.project-shot').evaluateAll(async images=>{for(const img of images){img.loading='eager';await img.decode();}});
  await page.screenshot({path:path.join(evidence,`page-${width}.png`),fullPage:true});
  return {overflow,axeViolations:axe.violations.length};
 });
 await test('Tablet/mobile menu: open, Escape, repeated toggles, anchor and outside close',async()=>{
  for(const width of [1024,768,390]){
   await page.setViewportSize({width,height:900});await page.goto(base);
   await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
   for(let i=0;i<4;i++)await page.locator('#menu').click();
   await page.locator('#menu').click();await page.locator('#navlinks a[href="#services"]').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
   await page.locator('#menu').click();await page.locator('h1').click({force:true});assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');
  }
 });
 for(const reduced of [false,true]) await test(`Carousel: one-card steps, independent rows, rapid clicks, keyboard, no autoplay (reduced motion ${reduced})`,async()=>{
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.setViewportSize({width:390,height:900});await page.goto(base);
  const rows=page.locator('.service-carousel-row');
  const first=rows.nth(0);const second=rows.nth(1);await first.scrollIntoViewIfNeeded();
  const step=await first.evaluate(row=>row.querySelector('.service').getBoundingClientRect().width+parseFloat(getComputedStyle(row.querySelector('.service-track')).gap));
  await first.locator('[data-direction="next"]').click();await page.waitForTimeout(750);
  assert.ok(Math.abs(await first.locator('.service-lane').evaluate(el=>el.scrollLeft)-step)<3,'First step is not one card');
  assert.equal(await second.locator('.service-lane').evaluate(el=>el.scrollLeft),0);
  await first.locator('[data-direction="prev"]').click();await page.waitForTimeout(750);assert.ok(await first.locator('.service-lane').evaluate(el=>el.scrollLeft)<2);
  await first.locator('[data-direction="next"]').evaluate(button=>{button.click();button.click();});await page.waitForTimeout(750);assert.ok(Math.abs(await first.locator('.service-lane').evaluate(el=>el.scrollLeft)-step*2)<3,'Rapid clicks lost');
  await second.locator('[data-direction="next"]').click();await page.waitForTimeout(750);assert.ok(Math.abs(await second.locator('.service-lane').evaluate(el=>el.scrollLeft)-step)<3);
  await second.locator('.service-lane').focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(750);assert.ok(await second.locator('.service-lane').evaluate(el=>el.scrollLeft)<2);
  const before=await first.locator('.service-lane').evaluate(el=>el.scrollLeft);await page.waitForTimeout(1100);assert.equal(await first.locator('.service-lane').evaluate(el=>el.scrollLeft),before);
  for(let i=0;i<12;i++)await first.locator('[data-direction="next"]').evaluate(el=>el.click());await page.waitForTimeout(750);assert.equal(await first.locator('[data-direction="next"]').isDisabled(),true);
  for(let i=0;i<12;i++)await first.locator('[data-direction="prev"]').evaluate(el=>el.click());await page.waitForTimeout(750);assert.ok(await first.locator('.service-lane').evaluate(el=>el.scrollLeft)<2);
 });
 await test('Enquiry validation, encoded drafts, service selection and duplicate preparation',async()=>{
  await page.goto(base);await page.locator('[data-service="Help me choose the right service"]').click();assert.equal(await page.locator('#service').inputValue(),'Help me choose');
  await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#name').getAttribute('aria-invalid'),'true');
  await page.locator('#name').fill('  ');await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#name').getAttribute('aria-invalid'),'true');
  await page.locator('#name').fill('Audit Test');await page.locator('#email').fill('invalid');await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#email').getAttribute('aria-invalid'),'true');
  await page.locator('#email').fill('audit@example.com');await page.locator('#phone').fill('123');await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#phone').getAttribute('aria-invalid'),'true');
  await page.locator('#phone').fill('+91 86106 24572');await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#message').getAttribute('aria-invalid'),'true');
  await page.locator('#message').fill('Audit only: ₹ & <script>alert(1)</script>\nSecond line');await page.locator('#contactForm [type="submit"]').click();
  assert.equal(await page.locator('#draft-panel').isVisible(),true);assert.match(await page.locator('#formstatus').innerText(),/Nothing has been sent/);
  const email=await page.locator('#draft-email').getAttribute('href');const wa=await page.locator('#draft-whatsapp').getAttribute('href');
  assert.match(email,/^mailto:varunsaiofficial45@gmail.com\?/);assert.match(wa,/^https:\/\/wa.me\/918610624572\?text=/);assert.match(decodeURIComponent(email),/₹ & <script>alert\(1\)<\/script>/);
  for(let i=0;i<4;i++)await page.locator('#contactForm [type="submit"]').click();assert.equal(await page.locator('#draft-panel').count(),1);
  await page.locator('#message').fill('Changed project');assert.equal(await page.locator('#draft-panel').isVisible(),false);
  await page.locator('#contactForm [type="submit"]').click();await page.locator('#copy-enquiry').click();await page.waitForFunction(()=>/copied|selected/.test(document.getElementById('formstatus').textContent));assert.match(await page.locator('#formstatus').innerText(),/copied|selected/);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();fs.writeFileSync(path.join(evidence,'axe-enquiry.json'),JSON.stringify(axe.violations,null,2));assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
  return 'Drafts inspected only. No message sent to email or WhatsApp.';
 });
 await test('FAQ disclosure and reduced-motion computed styles',async()=>{
  await page.locator('.faq-item summary').first().click();assert.equal(await page.locator('.faq-item').first().getAttribute('open'),'');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');assert.equal(await page.locator('.core-3d').evaluate(el=>getComputedStyle(el).animationName),'none');
 });
 await test('JavaScript-disabled content, navigation fallback and safe form',async()=>{
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});const p=await nojs.newPage();await p.goto(base);assert.equal(await p.locator('h1').isVisible(),true);assert.equal(await p.locator('#contactForm [type="submit"]').isDisabled(),true);assert.equal(await p.locator('#contactForm noscript').isVisible(),true);assert.equal(await p.locator('#navlinks a[href="#pricing"]').isVisible(),true);await nojs.close();
 });
 await test('Unknown routes return genuine 404 and index redirect works',async()=>{
  assert.equal((await context.request.get(base+'/missing-page')).status(),404);assert.equal((await context.request.get(base+'/index.html',{maxRedirects:0})).status(),301);
  assert.equal((await context.request.get(base+'/assets/favicon.svg')).status(),200);
 });
 await test('No browser runtime errors or failed local requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);return {errors,failed};});
 // A deterministic typographic share card, not a replacement portfolio image.
 const card=await context.newPage();await card.setViewportSize({width:1200,height:630});await card.setContent('<!doctype html><html><body style="margin:0;background:#0B0D0B;color:#F3F5F0;font-family:Arial,sans-serif"><main style="padding:76px"><p style="font-size:26px;letter-spacing:6px;color:#78D641">FLOWNIX / BANGALORE</p><h1 style="font-size:78px;line-height:1.05;max-width:1000px;margin:40px 0">Digital that works<br>for your business.</h1><p style="font-size:26px;border-top:2px solid #78D641;padding-top:28px">Websites · Marketing · Business automation</p></main></body></html>');await card.screenshot({path:path.join(root,'assets/social-card.png')});
 await browser.close();
 const resultFile=path.join(evidence,'browser-results.json');
 const combined=process.env.TEST_FILTER&&fs.existsSync(resultFile)?JSON.parse(fs.readFileSync(resultFile,'utf8')).results.filter(old=>!results.some(current=>current.name===old.name)).concat(results):results;
 fs.writeFileSync(resultFile,JSON.stringify({date:new Date().toISOString(),lastRunFilter:process.env.TEST_FILTER||null,results:combined},null,2));
 if(results.some(r=>r.status==='failed'))process.exitCode=1;
})().catch(e=>{console.error(e);fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({results,error:e.stack},null,2));process.exitCode=1;});
