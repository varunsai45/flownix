const fs=require('node:fs');const path=require('node:path');const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');const results=path.join(root,'test-results');
const browser=JSON.parse(fs.readFileSync(path.join(results,'browser-results.json'),'utf8'));
const audits=['mobile','desktop'].map(mode=>JSON.parse(fs.readFileSync(path.join(results,`lighthouse-${mode}-summary.json`),'utf8')));
const bytes=file=>{const buffer=fs.readFileSync(path.join(root,'dist',file));return `${buffer.length.toLocaleString()} bytes (${zlib.gzipSync(buffer).length.toLocaleString()} bytes gzip estimate)`;};
const tests=browser.results.map(r=>`| ${r.name} | ${r.status.toUpperCase()}${r.error?' — '+r.error.replaceAll('|','/'):''} |`).join('\n');
const metrics=audits.map(r=>`| ${r.mode} | ${Math.round(r.categories.performance*100)} | ${Math.round(r.categories.accessibility*100)} | ${Math.round(r.categories['best-practices']*100)} | ${Math.round(r.categories.seo*100)} | ${r.metrics['largest-contentful-paint']} | ${r.metrics['total-blocking-time']} | ${r.metrics['cumulative-layout-shift']} |`).join('\n');
const report=`# Flownix pre-deployment audit

> **Design update — 12 October 2026:** The owner replaced the original two-colour requirement with black backgrounds, off-white text, lime accents and original-colour project previews. The green image filter has been removed. The original audit below records the earlier design; its Lighthouse scores apply to that earlier audited build. Current theme checks are run separately.


Audit date: 10 October 2026. Verdict: **READY AFTER THE LISTED MANUAL STEPS**.

No deployment, DNS changes or outbound enquiries were made. The supplied ZIP remains unchanged. Work was done in a separately extracted folder. The archive contained ten files and no Git metadata; the parent directory was not a Git repository. The original source documents and both HTML files were backed up outside the deliverable project before editing.

## A. Issues found

1. **Brand mismatch:** the original used numerous greys, white text, a different lime, multicolour browser dots, non-brand gradients and dark blue tones. Native button defaults also needed explicit styling in the expanded enquiry state.
2. **Incorrect campaign claims:** ₹1.2 crore and ₹3.4 crore were described as revenue rather than reported potential revenue. Unverified ongoing-campaign wording and a “Most requested” pricing label implied unsupported activity/popularity.
3. **Malformed CSS:** the final mobile media query had an unclosed brace. The source also contained repeated style revisions and obsolete stock-photo/mockup styles.
4. **Navigation gaps:** tablet links disappeared without an available menu at some widths. The menu lacked Escape/outside/focus dismissal and a relationship to its controlled navigation. Accessible names did not consistently contain visible labels.
5. **Carousel defects:** touch-action pan-x could prevent vertical page movement over the cards; rapid smooth-scroll clicks used in-flight positions; keyboard movement used 75% of the lane instead of one card and ignored reduced motion. Boundary buttons gave no state feedback.
6. **Contact limitations:** the original form only opened mailto, had no backend, no phone validation, repeated its feedback text, and lacked a useful no-email-client fallback. Service selection had unmatched values, including “Help me choose.” No credentials or hidden submission integration were present.
7. **Motion/layout:** perpetual decorative 3D animation, unnecessary hover movement and will-change, a disconnected dot in the hero mark, and cramped pricing/results composition needed refinement. The original reveal strategy could leave content hidden if JavaScript failed midway.
8. **Assets/performance:** all five required original images existed; no missing image filename was found. They were eagerly loaded without intrinsic dimensions. Remote font stylesheets added external requests. Two independently maintained HTML versions could drift.
9. **SEO/deployment:** no confirmed domain, canonical, sitemap or absolute social-sharing image URL. No real favicon asset, production build, test harness, security-header configuration or 404 page. The original source had invalid raw ampersands, implicit element types and inappropriate ARIA labels.
10. **External verification:** Juggle returned HTTP 403 browser verification to automated Chrome. The other four sites loaded successfully. This does not establish that Juggle is broken for human visitors.
11. **Audit tooling:** initial development-only Lighthouse dependencies had 27 advisories. Lighthouse was updated compatibly from 13.0.3 to 13.5.0; final npm audit reported zero advisories. No runtime package upgrade was required.

## B. Fixes completed and files

| Files | Changes |
| --- | --- |
| index.html | Preserved sections and real projects; corrected campaign wording and founder attribution; distinguished live website work from planned AI products; fixed semantics, accessible names and service selection content; added draft UI, truthful contact disclosure, skip link and intrinsic image dimensions. |
| assets/site.css, assets/no-js.css | Extracted existing CSS; enforced #0B0D0B/#78D641 and alpha variants; repaired media query; corrected tablet navigation, native button background, pricing/results spacing, focus indicators, touch handling and hero mark; removed obsolete mockup styles and perpetual animation. A noscript-only fallback stylesheet avoids mobile startup layout shift. |
| assets/site.js | Extracted/replaced interaction code; independent one-card carousels with accumulated rapid-click targets and boundary states; reduced-motion keyboard scrolling; accessible menu dismissal; validated, escaped/encoded enquiry drafts; copy fallback; safe no-JavaScript form behaviour. |
| assets/*-preview.webp | No replacements or edits. All five original images retained; browser decode checks and archive hash comparisons confirm preservation. A reversible SVG/CSS duotone display treatment keeps them within the requested palette. |
| assets/favicon.svg, assets/social-card.png | Brand favicon and a plain typographic social card. No generated/fake project screenshots. |
| scripts/build.cjs | Reproducible static build; minified CSS; generated standalone preview; domain-gated canonical/schema/social metadata, robots and sitemap; security-header files. |
| scripts/preview.cjs, 404.html | Local output preview with security headers, a real 404 and /index.html redirect. Hosting must reproduce these behaviours. |
| package.json, package-lock.json, jsconfig.json, .gitignore | Pinned development tools, lint/type/browser/build scripts and ignored dependencies/output. No shipped runtime packages. |
| scripts/check.cjs, test.cjs, extra-checks.cjs, build-test.cjs, performance.cjs | HTML/CSS validation, source integrity assertions, Chrome/axe regression tests, touch/live-link checks, domain-build fixtures and Lighthouse runs. |
| README.md, DEPLOYMENT.md, SEO-LAUNCH-CHECKLIST.md | Accurate preview, enquiry and launch instructions. |
| index-standalone.html, dist/, test-results/ | Generated offline review copy, preview build output and test evidence. |

Static HTML, CSS and vanilla JavaScript remain the implementation. One homepage uses section anchors: home, services, work, results, systems, process, about, pricing, FAQ and contact. There is no backend, database, SPA router, authentication or API integration. Only SITE_URL is needed at production build time; it is public configuration. There are no runtime secrets.

## C. Test results

| Check | Result |
| --- | --- |
| Dependency installation and lockfile | Completed with npm; development tools only. |
| npm run lint | PASS: JavaScript syntax, recommended HTML validation, CSS parser, brand literal checks, file references, unique IDs, anchors, schema business data and campaign wording. |
| npm run typecheck | PASS: TypeScript checkJs analysis of browser JavaScript; noEmit. |
| npm run build | PASS: final domainless preview output; production mode deliberately requires SITE_URL. |
| Domain build tests | PASS: rejects absent/HTTP/path origins; generates canonical, social/schema URLs, robots and sitemap for an isolated fixture; removes stale sitemap on preview rebuild. No fixture domain enters delivered output. |
| 21st deterministic UI review | Executed before and after fixes; zero findings on its one-file HTML review. This tool did not catch several issues found by code/browser checks. |
| npm audit | Zero known vulnerabilities, including development tools, at the time run. |
| Local runtime requests | Browser test reports below; no application backend or external font requests. |
| Emulated touch | PASS: vertical page movement over carousel 125px; horizontal swipe 332px. This is Chrome mobile emulation, not physical-device testing. |
| Five original images | PASS: all decode in Chrome; source/output paths match filename casing and extension; original bytes preserved. |

### Browser regression results

| Test | Result |
| --- | --- |
${tests}

Screenshots and axe details are in test-results. Browser tests cover desktop, tablet and narrow mobile sizes, normal/reduced motion, repeated interactions and JavaScript-disabled content. Inspection included expanded enquiry validation/draft/copy states; the native copy-button background defect found there was corrected.

### External destinations

| Project | Browser result |
| --- | --- |
| CASAMELIA International | HTTP 200; correct business title at https://www.casameliainternational.com/ |
| ENCLOSE SYSTEMS | HTTP 200; correct business title at https://www.enclosesystems.com/ |
| Adorno Designers | HTTP 200 after redirect from www to https://adornodesigners.in/; correct business title. Supplied www link retained. |
| INFENSOL | HTTP 200; correct business title at https://www.infensol.com/ |
| Juggle | https://juggle.co.in/ matches the requested destination; automated Chrome received HTTP 403 verification. A web reader could retrieve the Juggle homepage, but that does not replace a normal-browser launch check. |

### Lighthouse, local lab measurements

| Profile | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
${metrics}

These scores were measured against the local **non-indexable preview**, using Lighthouse 13.5.0. SEO is reduced because noindex and robots blocking are intentional until the owner supplies a purchased domain. Absolute canonical/share URLs and a public sitemap cannot be honestly verified without it. The source and generated metadata have been checked; no live Search Console or Google rich-results validation was performed.

LCP/CLS are lab observations; no real-user INP or field Core Web Vitals can be reported before traffic exists. Local hosting does not prove deployment performance. Remaining informational Lighthouse opportunities (such as CSS/image byte savings) are documented in its full reports; original screenshots were preserved as requested.

Production-output sizes: index.html ${bytes('index.html')}; CSS ${bytes('assets/site.css')}; JavaScript ${bytes('assets/site.js')}. Gzip figures are offline estimates, not evidence that a host has enabled compression. Original WebP assets total 432,618 bytes.

### Contact, security and SEO limits

Required-field, email/optional-phone validation, inline errors, focus, service selection, draft encoding, repeat preparation, draft invalidation and clipboard/fallback behaviour were exercised. Email and WhatsApp destinations were inspected without sending enquiries. There is no asynchronous submission/loading state because no network submission exists; clipboard work does disable its control while pending. Actual delivery requires the visitor to send in their chosen app and must be tested manually.

No secret credentials were found in the supplied archive. Production resources are local; outbound destinations are the supplied project links, phone, email and WhatsApp. External tabs use noopener/noreferrer. Generated headers constrain scripts, resources, frames and form actions. Inline style attributes remain supported by the CSP; script execution is self/hash restricted. The offline standalone review copy does not have server response headers.

## D. Remaining issues / manual steps

1. Purchase and confirm the domain, preferred hostname and static host. Set SITE_URL and run the production build. Current dist is intentionally non-indexable.
2. Check Juggle in a normal browser. Complete a real email/WhatsApp handoff and confirm receipt from your own desktop and phone. Automatic form submission is not implemented; if required, choose/configure a real backend and repeat end-to-end delivery/error tests.
3. Verify supplied project roles/client permission, original pricing and campaign records. No testimonials, awards, certifications, fake ratings or new performance claims were added. AI calling/chat products remain planned/in development.
4. After explicit launch approval, apply HTTPS, hostname/index redirects, proper 404s, generated headers and compression on the chosen host; verify actual deployed behaviour. The host is not yet chosen, so these cannot be certified locally.
5. Check final-domain canonical, sitemap, robots, sharing previews and structured data. Verify Search Console and submit the sitemap.
6. Manually check a physical iOS/Android device and assistive technology. Automated Chrome/axe testing is not exhaustive accessibility or cross-browser certification.

## E. Deployment verdict

**READY AFTER THE LISTED MANUAL STEPS.** The repaired static draft-based contact flow and local build are reviewable; a public SEO launch still depends on the purchased domain, host configuration, contact receipt and external-link checks. No public deployment is authorized or performed.

## F. Exact next steps

1. Open index-standalone.html to review the polished page, or run npm run preview after npm run build and open http://127.0.0.1:4173.
2. Read DEPLOYMENT.md and buy/confirm the domain.
3. Set SITE_URL to that HTTPS origin. Run npm ci, npm run lint, npm run typecheck and npm run build:production.
4. Verify contact handoff/receipt and Juggle manually. Review the production output.
5. Explicitly approve deployment, then publish only dist to the selected static host and complete the final-host checklist. Do not publish the source folder or the current domainless preview by mistake.
`;
fs.writeFileSync(path.join(root,'AUDIT-REPORT.md'),report);
fs.writeFileSync(path.join(root,'SEO-LAUNCH-CHECKLIST.md'),'# SEO launch checklist\n\nThe production domain is not purchased. Follow the manual launch checklist in [DEPLOYMENT.md](DEPLOYMENT.md) and the findings in [AUDIT-REPORT.md](AUDIT-REPORT.md).\n\nBuild with SITE_URL only after the actual HTTPS domain is confirmed. The current dist folder deliberately blocks indexing. Verify canonical, Open Graph/Twitter, business schema, robots and sitemap on the final host. Do not publish the standalone duplicate. Revenue figures are reported potential revenue, not confirmed sales. No ranking guarantee or fabricated rating is included.\n');
console.log('Wrote AUDIT-REPORT.md from actual saved browser and Lighthouse results.');
