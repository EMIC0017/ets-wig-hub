# Visitor analytics — setup

The WIG Hub now collects rich visitor stats client-side and POSTs them to a Google
Apps Script web app, which appends rows to a **Visitors** tab in the WIG Manager
spreadsheet. One-time deploy (~3 min).

## What gets logged

Every pageview, route change, click, 30s heartbeat, and unload event captures:

- **Identity:** durable `visitor_id` (localStorage), per-tab `session_id`, visit count, first-visit flag
- **Page:** URL, path, hash, WIG drill-down id, page title, referrer, prev hash
- **Browser:** UA, parsed browser + version, OS, device type, language(s), timezone, color scheme
- **Hardware/network:** screen + viewport size, DPR, touch, CPU cores, RAM (GB), connection type, downlink Mbps, RTT
- **Performance:** TTFB, DOM ready, page load, time on page, max scroll depth
- **Behavior:** click target + text, route changes, periodic pings
- **Attribution:** UTM source/medium/campaign

What is *not* captured: IP address (Apps Script doesn't expose it), keystrokes, form values, anything you type.

## Deploy steps

1. Open <https://script.google.com/> → **New project**.
2. Replace `Code.gs` with the contents of [`analytics/apps-script.gs`](analytics/apps-script.gs).
3. **Project Settings** (⚙️ gear) → **Script Properties** → **Add script property**:
   - `SHEET_ID` = `1R8IaSO6PgRGyeqPB0KdZ6UV_ujwuK2FMS8fa94taS90`
4. **Deploy** → **New deployment** → type **Web app**
   - **Execute as:** *Me (you)* — so the script can write to the sheet
   - **Who has access:** *Anyone* — so the public site can POST
   - Click **Deploy**, copy the resulting `…/exec` URL.
5. Edit [`analytics-config.js`](analytics-config.js) and paste the URL:
   ```js
   window.WIG_ANALYTICS_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
   ```
6. Commit + push. Live in ~1 min via GitHub Pages. The Apps Script will create the
   **Visitors** tab on the first event.

## How to view the log

- Open WIG Manager spreadsheet → **Visitors** tab. Each row = one event.
- Filter / pivot like any sheet.
- Export CSV: *File → Download → Comma-separated values*.

## Disable temporarily

Set `window.WIG_ANALYTICS_DISABLED = true;` in `analytics-config.js`.

## Re-deploy after changing apps-script.gs

Apps Script web apps require a *new deployment* (or "Manage deployments → edit →
new version") for changes to take effect.
