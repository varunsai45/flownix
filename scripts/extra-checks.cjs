const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const out=path.join(root,'test-results');const results=[];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:4173');
 await page.screenshot({path:path.join(out,'desktop-hero.png')});
 await page.locator('#work').scrollIntoViewIfNeeded();await page.locator('.project-shot').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});await page.screenshot({path:path.join(out,'desktop-portfolio.png')});
 const dimensions=await page.locator('.project-shot').evaluateAll(imgs=>imgs.map(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight})));
 results.push({test:'Image dimensions',images:dimensions});
 for(const url of ['https://www.casameliainternational.com/','https://www.enclosesystems.com/','https://www.adornodesigners.in/','https://www.infensol.com/','https://juggle.co.in/']){
  try{const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});const result={url,finalURL:page.url(),status:res.status(),title:await page.title()};results.push(result);console.log(JSON.stringify(result));}catch(e){const result={url,error:e.message};results.push(result);console.log(JSON.stringify(result));}
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const mobile=await ctx.newPage();await mobile.goto('http://127.0.0.1:4173');await mobile.locator('#services').scrollIntoViewIfNeeded();
 const session=await ctx.newCDPSession(mobile);
 async function swipe(x1,y1,x2,y2){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/12,y:y1+(y2-y1)*i/12}]});await mobile.waitForTimeout(16);}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(600);}
 await mobile.locator('#service-lane-1').scrollIntoViewIfNeeded();const box=await mobile.locator('#service-lane-1').boundingBox();
 const y=Math.min(650,Math.max(160,box.y+150));const before=await mobile.evaluate(()=>scrollY);await swipe(190,y,190,y-140);const after=await mobile.evaluate(()=>scrollY);assert.ok(after>before+20,`Vertical touch failed ${before}->${after}`);
 await mobile.locator('#service-lane-1').scrollIntoViewIfNeeded();const box2=await mobile.locator('#service-lane-1').boundingBox();await swipe(310,Math.min(650,box2.y+160),70,Math.min(650,box2.y+160));const left=await mobile.locator('#service-lane-1').evaluate(el=>el.scrollLeft);assert.ok(left>30,'Horizontal touch did not move cards');
 results.push({test:'Emulated touch over carousel',verticalScrollDelta:after-before,horizontalScroll:left,status:'passed'});
 await mobile.goto('http://127.0.0.1:4173');await mobile.screenshot({path:path.join(out,'mobile-hero.png')});
 await mobile.locator('#work').scrollIntoViewIfNeeded();await mobile.locator('.project-shot').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});await mobile.screenshot({path:path.join(out,'mobile-portfolio.png')});
 await browser.close();fs.writeFileSync(path.join(out,'extra-results.json'),JSON.stringify(results,null,2));
})().catch(e=>{fs.writeFileSync(path.join(out,'extra-results.json'),JSON.stringify({results,error:e.stack},null,2));console.error(e);process.exitCode=1;});
