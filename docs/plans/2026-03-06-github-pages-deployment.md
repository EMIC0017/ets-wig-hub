# GitHub Pages Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the ETS WIG Hub dashboard to GitHub Pages with auto-deploy on push to main.

**Architecture:** GitHub Actions workflow builds the Vite app with secrets injected as env vars, then deploys the `dist/` folder to GitHub Pages. A `404.html` handles SPA routing so direct URL access and page refreshes work.

**Tech Stack:** Vite, GitHub Actions, GitHub Pages, `actions/deploy-pages`

---

### Task 1: Set Vite base path and BrowserRouter basename

**Files:**
- Modify: `dashboard/vite.config.js`
- Modify: `dashboard/src/App.jsx`

**Step 1: Update vite.config.js to set base path**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/ets-wig-hub/',
  plugins: [react(), tailwindcss()],
});
```

**Step 2: Add basename to BrowserRouter**

In `dashboard/src/App.jsx`, change:
```jsx
<BrowserRouter>
```
to:
```jsx
<BrowserRouter basename="/ets-wig-hub">
```

**Step 3: Verify the build succeeds**

Run: `cd /Users/ericmorin/Projects/ets-wig-hub/dashboard && npm run build`
Expected: Build completes. Check that `dist/index.html` references assets with `/ets-wig-hub/` prefix.

**Step 4: Commit**

```bash
git add dashboard/vite.config.js dashboard/src/App.jsx
git commit -m "feat: configure vite base path and router basename for GitHub Pages"
```

---

### Task 2: Add 404.html for SPA routing

**Files:**
- Create: `dashboard/public/404.html`
- Modify: `dashboard/index.html` (add redirect restoration script)

**Step 1: Create 404.html**

Create `dashboard/public/404.html` with the SPA redirect script. This uses the technique from [spa-github-pages](https://github.com/rafgraph/spa-github-pages) — it encodes the path into a query param and redirects to index.html:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ETS WIG Hub</title>
    <script>
      // Redirect all 404s to index.html, preserving the path as a query param.
      // The segment count (1) strips the repo name from the path.
      var pathSegmentsToKeep = 1;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
```

**Step 2: Add path restoration script to index.html**

In `dashboard/index.html`, add this script inside `<head>`, before any other scripts:

```html
<script>
  // Restore SPA path from 404.html redirect query param
  (function(l) {
    if (l.search[1] === '/') {
      var decoded = l.search.slice(1).split('&').map(function(s) {
        return s.replace(/~and~/g, '&');
      }).join('?');
      window.history.replaceState(null, null,
        l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location));
</script>
```

**Step 3: Verify build includes 404.html**

Run: `cd /Users/ericmorin/Projects/ets-wig-hub/dashboard && npm run build && ls dist/404.html`
Expected: File exists in `dist/`.

**Step 4: Commit**

```bash
git add dashboard/public/404.html dashboard/index.html
git commit -m "feat: add 404.html SPA routing workaround for GitHub Pages"
```

---

### Task 3: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create the workflow file**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: dashboard

      - name: Build
        run: npm run build
        working-directory: dashboard
        env:
          VITE_SHEET_ID: ${{ secrets.VITE_SHEET_ID }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_GOOGLE_API_KEY: ${{ secrets.VITE_GOOGLE_API_KEY }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dashboard/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Verify YAML is valid**

Run: `cd /Users/ericmorin/Projects/ets-wig-hub && python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
Expected: No error output.

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

### Task 4: Manual steps (post-push)

These steps must be done by the user in the browser after pushing:

**Step 1: Add GitHub repository secrets**

Go to: `https://github.com/EMIC0017/ets-wig-hub/settings/secrets/actions`

Add three secrets:
- `VITE_SHEET_ID` — your Google Sheet ID
- `VITE_GOOGLE_CLIENT_ID` — your OAuth client ID
- `VITE_GOOGLE_API_KEY` — your API key

**Step 2: Enable GitHub Pages**

Go to: `https://github.com/EMIC0017/ets-wig-hub/settings/pages`

Set source to **GitHub Actions** (not "Deploy from a branch").

**Step 3: Update Google OAuth authorized origins**

Go to Google Cloud Console > APIs & Services > Credentials > your OAuth client.

Add `https://emic0017.github.io` to **Authorized JavaScript origins**.

**Step 4: Push and verify**

```bash
git push origin main
```

Check the Actions tab for a successful deploy, then visit:
`https://emic0017.github.io/ets-wig-hub/`
