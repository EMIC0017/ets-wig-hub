# GitHub Pages Deployment Design

**Date:** 2026-03-06
**Status:** Approved

## Context

Deploy the ETS WIG Hub React+Vite dashboard to GitHub Pages for use by the ETS team (~7 people). The app is a pure client-side SPA that authenticates via Google OAuth and reads/writes to Google Sheets.

## Design

### SPA Routing Workaround

GitHub Pages returns a 404 for any path other than `index.html`. A `404.html` file in `public/` redirects to `index.html` with the original path preserved as a query parameter. A script in `index.html` restores the path on load.

### GitHub Actions Workflow

On push to `main`:
1. Checkout code
2. Install dependencies (`npm ci` in `dashboard/`)
3. Build (`npm run build`) with env vars from GitHub Secrets
4. Deploy `dashboard/dist/` to GitHub Pages using `actions/deploy-pages`

### Environment Variables

Stored as GitHub repository secrets, injected at build time:
- `VITE_SHEET_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

### Vite Base Path

Set `base: '/ets-wig-hub/'` in `vite.config.js` so assets resolve correctly under the GitHub Pages subpath (`https://emic0017.github.io/ets-wig-hub/`).

### Google OAuth Update (manual)

Add `https://emic0017.github.io` as an authorized JavaScript origin in the Google Cloud Console OAuth client configuration.

## Files to Create/Modify

| File | Change |
|------|--------|
| `dashboard/vite.config.js` | Add `base: '/ets-wig-hub/'` |
| `dashboard/public/404.html` | SPA redirect script |
| `.github/workflows/deploy.yml` | Build + deploy GitHub Actions workflow |
