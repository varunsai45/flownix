const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const {default:lighthouse}=await import('lighthouse');const chromeLauncher=await import('chrome-launcher');
 const chrome=await chromeLauncher.launch({chromeFlags:['--headless','--disable-gpu','--no-first-run']});
 const out=path.resolve(__dirname,'../test-results');
 try{
  for(const mode of ['mobile','desktop']){
   const flags={port:chrome.port,output:['json','html'],logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']};
   if(mode==='desktop'){flags.formFactor='desktop';flags.screenEmulation={mobile:false,width:1440,height:900,deviceScaleFactor:1,disabled:false};flags.throttling={rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1};}
   const result=await lighthouse('http://127.0.0.1:4173',flags);
   fs.writeFileSync(path.join(out,`lighthouse-${mode}.json`),result.report[0]);fs.writeFileSync(path.join(out,`lighthouse-${mode}.html`),result.report[1]);
   const summary={mode,categories:Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,v.score])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,result.lhr.audits[k].displayValue])),failed:Object.entries(result.lhr.audits).filter(([,v])=>v.score!==null&&v.score<.9).map(([id,v])=>({id,score:v.score,title:v.title,description:v.description,details:v.details}))};
   fs.writeFileSync(path.join(out,`lighthouse-${mode}-summary.json`),JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,failed:summary.failed.map(f=>({id:f.id,score:f.score}))}));
  }
 }finally{await chrome.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
