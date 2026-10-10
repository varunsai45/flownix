const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
// Isolated fixture folder under test-results; synthetic domain never enters deliverables.
const fixture=path.join(root,'test-results/build-fixture');fs.mkdirSync(path.join(fixture,'scripts'),{recursive:true});
for(const file of ['index.html','404.html'])fs.copyFileSync(path.join(root,file),path.join(fixture,file));
fs.cpSync(path.join(root,'assets'),path.join(fixture,'assets'),{recursive:true});fs.copyFileSync(path.join(root,'scripts/build.cjs'),path.join(fixture,'scripts/build.cjs'));
function run(value,production=true){const env={...process.env};delete env.SITE_URL;if(value)env.SITE_URL=value;return spawnSync(process.execPath,[path.join(fixture,'scripts/build.cjs'),...(production?['--production']:[])],{env,encoding:'utf8'});}
assert.notEqual(run().status,0);assert.notEqual(run('http://flownix-build-check.example').status,0);assert.notEqual(run('https://flownix-build-check.example/path').status,0);
const generated=run('https://flownix-build-check.example');assert.equal(generated.status,0,generated.stderr);
const html=fs.readFileSync(path.join(fixture,'dist/index.html'),'utf8');assert.ok(html.includes('rel="canonical" href="https://flownix-build-check.example/"'));assert.ok(html.includes('https://flownix-build-check.example/assets/social-card.png'));assert.ok(!html.includes('noindex'));
const sitemap=fs.readFileSync(path.join(fixture,'dist/sitemap.xml'),'utf8');assert.ok(sitemap.includes('<loc>https://flownix-build-check.example/</loc>'));assert.ok(fs.readFileSync(path.join(fixture,'dist/robots.txt'),'utf8').includes('Sitemap: https://flownix-build-check.example/sitemap.xml'));
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][0].url,'https://flownix-build-check.example/');
assert.equal(run(undefined,false).status,0);assert.ok(!fs.existsSync(path.join(fixture,'dist/sitemap.xml')));assert.ok(fs.readFileSync(path.join(fixture,'dist/index.html'),'utf8').includes('noindex, nofollow'));
console.log('PASS: production domain required; HTTP/path rejected; canonical/social/schema/robots/sitemap generated only with explicit origin; stale sitemap removed on preview build.');
