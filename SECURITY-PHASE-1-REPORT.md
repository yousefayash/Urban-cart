# Urban Cart — Security Phase 1

## Scope
This is a separate working copy. The original upload was not modified. This phase covers CORS, security response headers, and the reviewed frontend XSS rendering paths only. It does not complete the remaining security phases.

## Changes
- CORS now allows same-origin browser requests and explicitly configured origins only. `VERCEL_URL` is included when available; configured `FRONTEND_ORIGIN` entries must be valid HTTPS origins in production (comma-separated for multiple origins).
- CORS credentials are disabled because the current API uses Bearer JWT authorization rather than cross-site cookies.
- Added Vercel-wide CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy headers.
- Removed inline JavaScript from the legacy redirect page and removed inline image error handlers so the CSP can use `script-src 'self'` without `unsafe-inline`.
- Escaped dynamic product, category, review, toast, cart, order, and related content before HTML insertion; constrained dynamic image URLs to HTTPS or same-origin HTTP and normalized browser-controlled cart quantities/IDs before rendering.

## Checks
- `node --check`: passed for 40 JavaScript files.
- Vercel configuration JSON parse and presence of six security headers: passed.
- HTML inline script blocks and inline event-handler attributes: none found.
- HTML escaping payload test: passed.
- Image URL protocol tests (javascript:/data: rejected; HTTPS accepted): passed.
- Duplicated root/public JavaScript files: synchronized.

## Not verified
- `npm ci` did not complete within the available execution window, so `npm run build` could not be run (`vite: not found`). Do not deploy this copy until dependencies install and the production build succeeds.
- No live Vercel response-header, browser-flow, CORS integration, or database test was performed.
- This phase does not migrate JWT out of LocalStorage, add token revocation, implement password reset, or integrate a payment provider. Those remain later phases.

## Deployment note
Before deployment, install dependencies and run `npm run build`. Confirm the deployed page and `/api/health` return the intended headers and that sign-in, sign-up, product images, cart, checkout, and admin flows still work. If the frontend calls the API from a separate origin, set `FRONTEND_ORIGIN` in the server environment to the exact HTTPS origin(s), comma-separated. Never put secrets in this file or the frontend.
