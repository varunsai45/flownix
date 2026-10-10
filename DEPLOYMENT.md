# Flownix: build, preview and launch

The owner has not purchased a domain yet. Nothing has been deployed. The supplied static site was repaired in a separate folder; the original ZIP is unchanged.

## Local checks

Use Node.js 22.19+ and npm. There are no runtime packages, backend, database, API keys or form service. Development tools are pinned in `package-lock.json`.

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

Open `http://127.0.0.1:4173`. With the preview running, `npm.cmd test` runs Chrome browser and axe checks. Google Chrome must be installed. Additional commands:

- `node scripts/extra-checks.cjs`: live client destinations and emulated touch.
- `node scripts/performance.cjs`: mobile/desktop Lighthouse.
- `node scripts/build-test.cjs`: isolated domain configuration tests.

`index-standalone.html` is an offline review copy with embedded original images. Do not publish it alongside the homepage.

## Configure the real domain

`npm run build` without `SITE_URL` creates a **non-indexable preview** in `dist/`, with `noindex, nofollow` and `Disallow: /`. It is not the public launch build.

After buying and confirming your HTTPS domain:

```powershell
$env:SITE_URL = Read-Host 'Enter your confirmed HTTPS origin, without a path'
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build:production
```

Hosting build command: `npm ci && npm run build:production`, or let the host install dependencies and run `npm run build:production`. Output directory: **dist**. Public build variable: **SITE_URL**. Set it in the host's environment; `.env` files are not automatically loaded. No server environment is required after building.

Production builds require a valid HTTPS origin and generate canonical/og:url, absolute social-image URLs, business/WebSite schema URLs, robots.txt, and a one-page XML sitemap. The synthetic `.example` domain used by build tests stays inside a test fixture excluded from the delivery ZIP.

## Hosting configuration

Publish only `dist/` to a static host. Do not upload dependencies, tests, backups, or the standalone preview. This site uses section fragments, with no SPA router or catch-all rewrite.

1. Enable HTTPS and redirect HTTP and the alternate www/non-www hostname to the preferred origin.
2. Redirect `/index.html` to `/` with HTTP 301.
3. Serve `404.html` with HTTP 404 for unknown paths; do not rewrite missing pages to index.html.
4. Apply generated `_headers` on a compatible host, or translate those headers into your platform settings. A Vercel header configuration is generated inside `dist/vercel.json`; Vercel source-root projects require configuration at their project root, so do not assume a config inside output is applied automatically.
5. Enable compression. Keep HTML/CSS/JS revalidated; filenames are not content hashed and must not use immutable long caching.
6. Verify all of this on the real HTTPS host before approving public launch. Local routing/header checks do not certify an unspecified hosting platform.

## Enquiries

The form validates name, email, optional phone, and message, then prepares a draft with email, WhatsApp and copy controls. **It does not submit to a server.** Visitors must press Send in their app. Edits invalidate old drafts, repeated preparation sends nothing, and clipboard failure selects the draft for manual copying. The site does not persist enquiry data or make submission requests.

Before launch, open the email and WhatsApp drafts on your own desktop/phone and send a real test enquiry yourself. If you require automatic receipt, choose and configure a form backend/service, server-side validation and spam protection, then test actual receipt, errors and duplicate prevention. No service was invented or connected.

## Images and design

All five supplied WebP files are unchanged. CSS applies a reversible black/lime duotone display filter; original screenshots, including their browser chrome and crop, remain intact. The live links show original site colours. `social-card.png` is a typographic Flownix share card, not a portfolio replacement.

CSS and JavaScript were extracted from the original HTML. Build minifies CSS. Device sans-serif fonts replace external font requests. Portfolio images load lazily and specify their intrinsic dimensions.

## Manual launch checklist

- Confirm domain, hosting, HTTPS, redirects, headers and production build settings.
- Open Juggle normally: automated Chrome encountered HTTP 403 browser verification.
- Confirm client project roles/permission, existing pricing and campaign records; revenue is **reported potential revenue**, not confirmed sales.
- Confirm real email/WhatsApp handoff and receipt.
- Check final-host console/network, mobile layout, every image, navigation and contact flow.
- Confirm production HTML has no noindex, robots allows crawling, and `/sitemap.xml` uses the final origin.
- Validate deployed schema with Google's Rich Results Test or Schema.org validator; no ratings/reviews are included, and rich-result eligibility is not guaranteed.
- Verify Search Console and submit the sitemap. Rerun live-host Lighthouse/PageSpeed; local lab results are not field Core Web Vitals.

Do not deploy until the owner explicitly approves publication.
