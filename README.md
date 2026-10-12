# Flownix audited website

## Files
- `index.html`: main source. Keep the `assets` folder beside it.
- `index-standalone.html`: single-file preview with the original project screenshots embedded.
- `assets/`: original project preview images used in the work section.
- `DEPLOYMENT.md`: exact build commands, hosting setup and manual launch steps.
- `AUDIT-REPORT.md`: findings, fixes, evidence and deployment verdict.
- `scripts/`: reproducible build, validation and browser checks.
- `dist/`: generated output; currently a non-indexable domainless preview.
- `test-results/`: browser screenshots, accessibility checks and Lighthouse reports.

## Services interaction
The Services section has two independent horizontal rows with left/right arrows. Each click advances one card. No automatic movement occurs. Trackpads, touch swipes and keyboard arrow keys are also supported.

## Before publishing
Read `DEPLOYMENT.md`. Purchase/confirm the domain, set `SITE_URL`, run `npm ci` and `npm run build:production`, then review `dist/`. Publish only `dist/` after explicit approval. The current preview deliberately blocks indexing.

The enquiry flow prepares a draft locally for email/WhatsApp; it does not submit to a backend. It never claims a message was sent. Test actual handoff and receipt yourself before launch.

All five supplied WebP assets are unchanged. The approved revised design uses black surfaces, off-white text, lime accents and original-colour project images. No runtime dependencies, credentials, database or API service are needed for this static implementation.

Generated build output and test evidence are excluded from Git. The delivered audit ZIP contains the original test evidence; running the documented checks regenerates it locally.
