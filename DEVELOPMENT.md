# ETS WIG Hub — Development Guide

> Everything you need to pick this project back up and continue working on it.

---

## Project Status (as of March 2026)

### What's Live
- **Google Sheet** ("ETS WIG Hub") with 10 tabs — the single source of truth
- **Apps Script automations** running on time triggers (weekly rows, Slack reminders, chair rotation)
- **Google AppSheet app** — deployed, provides mobile/desktop UI for the sheet
  - App URL: `https://www.appsheet.com/start/232ee446-a3c7-4452-95fe-bb41efc23ef5`
  - App Name: `ETSWIGManager-11769658`
- **WebApp.gs** — REST API layer deployed as Apps Script web app
  - Deployment URL: `https://script.google.com/a/macros/instacart.com/s/AKfycbyqpJngbRZ3s03YMdYNF_8okyi1cWXcKSl8tr_z6n0TJak6d6QvNmNUaAbT2jcx4JoQgg/exec`

### What's Archived (Not in Use)
- `dashboard/` — React + Vite frontend (abandoned: can't get Google OAuth credentials at Instacart)
- `.github/workflows/deploy.yml` — GitHub Pages CI (abandoned with the React frontend)
- `docs/plans/` — Historical design docs for GitHub Pages and Superblocks approaches (both blocked)

---

## Repository Structure

```
ets-wig-hub/
├── scripts/              # Apps Script files (copy into Apps Script editor)
│   ├── Config.gs         # Central constants: tab names, managers, Slack config
│   ├── Setup.gs          # One-time sheet builder (creates all 10 tabs)
│   ├── Utilities.gs      # Date helpers and sheet accessors
│   ├── WeeklySetup.gs    # Monday trigger: creates 6 Commitment Log rows
│   ├── SlackReminder.gs  # Tuesday trigger: Slack @mentions for missing entries
│   ├── ChairRotation.gs  # Tuesday trigger: advances meeting chair
│   └── WebApp.gs         # REST API (doGet/doPost) for external integrations
├── dashboard/            # [ARCHIVED] React + Vite frontend
├── docs/plans/           # [ARCHIVED] Historical design documents
├── SHEET_SETUP.md        # Tab-by-tab manual build spec
├── DEVELOPMENT.md        # This file
└── README.md             # Setup and usage instructions
```

---

## Apps Script Files

All `.gs` files live in the `scripts/` directory and must be manually pasted into the Apps Script editor attached to the Google Sheet.

### Config.gs — Central Configuration

The single source of truth for all constants. Every other script imports from here.

| Key | Purpose |
|-----|---------|
| `CONFIG.TABS` | Exact tab names (Dashboard, Commitment Log, Meeting, _Config, 6 team tabs) |
| `CONFIG.MANAGERS` | Array of 6 objects: `{ name, wig, wigName, target, targetType }` |
| `CONFIG.SLACK_WEBHOOK_URL` | Incoming Webhook URL for Slack notifications |
| `CONFIG.SLACK_USER_IDS` | Map of manager name → Slack user ID for @mentions |
| `CONFIG.LOG_COLS` | 1-based column indices for the Commitment Log |
| `CONFIG.TEAM_SCORE_ROW` | Row 3 — where team score lives on each team tab |
| `CONFIG.TEAM_UPDATED_ROW` | Row 4 — "Last Updated" on each team tab |
| `CONFIG.MEETING_DAY` | `2` (Tuesday) — the day of the weekly meeting |

**To change a manager or WIG:** Update `CONFIG.MANAGERS` and `CONFIG.TABS.TEAMS` in tandem. The tab names use em dashes (—) and must match exactly.

### Setup.gs — One-Time Sheet Builder

Run `setupWIGHub()` once on a blank Google Sheet. It creates all 10 tabs with:
- Headers, formulas, and cross-tab references
- Conditional formatting (green/yellow/red on scores and milestone statuses)
- Data validation (milestone status dropdowns, attendance checkboxes)
- Column widths and styling

**Idempotent:** If a tab already exists, it skips creation but re-applies formatting.

### Utilities.gs — Shared Helpers

| Function | Returns | Used By |
|----------|---------|---------|
| `getCurrentWeekEnding()` | Next Tuesday as `Date` | WeeklySetup, SlackReminder, ChairRotation, WebApp |
| `formatDateShort(date)` | `"Mar 7"` | SlackReminder |
| `formatDateISO(date)` | `"2026-03-07"` | WeeklySetup, SlackReminder |
| `getLogSheet()` | Commitment Log `Sheet` object | WeeklySetup, SlackReminder, WebApp |
| `getWeekRows(date)` | Array of `{row, manager, wig, lagResult, leadCommitment}` | WeeklySetup, SlackReminder, WebApp |

### WeeklySetup.gs — Monday Trigger

`generateWeeklyRows()` — Snapshots current scores to `_Config` (for trend comparison), then creates 6 rows in the Commitment Log (one per manager) for the upcoming Tuesday meeting. Idempotent: skips row creation if rows already exist for that week.

`snapshotScores()` — Copies each WIG's current score (from team tab B3) into `_Config` column D, with a timestamp in column E. Called automatically by `generateWeeklyRows()` but can also be run independently.

**Trigger:** Monday 8–9 PM

### SlackReminder.gs — Tuesday Reminder

`sendSmartReminder()` — Checks who hasn't filled in Lag Result and Lead Commitment, then sends a Slack Block Kit message tagging only those managers.

**Trigger:** Tuesday 8–9 AM (must run after `rotateChair`)

### ChairRotation.gs — Tuesday Chair Advance

`rotateChair()` — Reads the `_Config` tab, moves the `X` marker to the next manager, and writes the new chair name and meeting date to the Meeting tab.

**Trigger:** Tuesday 7–8 AM (must run before `sendSmartReminder`)

### WebApp.gs — REST API

Deployed as an Apps Script Web App. Provides JSON endpoints for reading and writing sheet data.

**GET endpoints** (`?action=<name>`):
| Action | Params | Returns |
|--------|--------|---------|
| `dashboard` | — | All 6 WIG rows (name, manager, score, target, trend, lastUpdated) |
| `commitments` | `weeks` (optional, default 1) | Commitment log entries for N most recent weeks |
| `meeting` | — | Meeting date, chair, attendance, scoreboard, AOB, next chair |
| `team` | `wig` (1-6, required) | Team score, milestones, manager, target |

**POST endpoints** (JSON body with `action`):
| Action | Body Fields | Effect |
|--------|-------------|--------|
| `update_score` | `wig` (1-6), `score` | Updates team tab B3 |
| `update_commitment` | `manager`, `lagResult`, `leadCommitment` | Fills current week's log entry |
| `update_attendance` | `attendance` (object: name→boolean) | Updates Meeting tab checkboxes |
| `update_aob` | `aob` (string) | Updates Meeting tab AOB cell |

---

## Google Sheet Structure

### Tab Map

| Tab | Range | Purpose |
|-----|-------|---------|
| Dashboard | A2:F7 | 6 WIG summary rows (formulas pull from team tabs) |
| Commitment Log | A1:E∞ | Weekly entries (auto-generated rows, manager-filled D/E) |
| Meeting | Fixed layout | Agenda: date, chair, attendance, scoreboard, AOB |
| WIG 1–6 (team tabs) | B3=score, B4=date, row 9+=milestones | Per-WIG tracking |
| _Config (hidden) | A2:B7 | Chair rotation state (X marker); D2:D7 = previous week scores; E2:E7 = snapshot dates |

### Key Cells

| Cell | Tab | What It Does |
|------|-----|--------------|
| `B3` | Each team tab | **Current Score** — the single most important input cell. Dashboard pulls from here. |
| `B4` | Each team tab | `=IF(B3<>"", TODAY(), "")` — auto-calculated last-updated date |
| `C2:C7` | Dashboard | `='WIG N — Name'!B3` — score formulas |
| `E2:E7` | Dashboard | Trend arrows (auto-formula for % WIGs, static `→` for text WIGs). Compares current score to `_Config` D column. Thresholds: >5% = ⬆, >0% = ↗, 0 = →, <0% = ↘, <-5% = ⬇ |
| `F2:F7` | Dashboard | `='WIG N — Name'!B4` — last-updated formulas |
| `D2:D7` | _Config | Previous week's scores (snapshotted by `generateWeeklyRows()` every Monday) |
| `B1` | Meeting | Meeting date (set by `rotateChair`) |
| `B2` | Meeting | Current chair (set by `rotateChair`) |

---

## AppSheet App

The live frontend. AppSheet connects natively to Google Sheets with no credentials required.

- **App ID:** `232ee446-a3c7-4452-95fe-bb41efc23ef5`
- **Views:**
  - **Dashboard** — table view, QuickEdit enabled, adds/deletes disabled (fixed 6 rows)
  - **Commitments** — table view, sorted by Week Ending desc, QuickEdit enabled
  - **Meeting** — detail view
- **Data tables:** Dashboard, Commitment Log, Meeting, WIG 1–6

---

## Environment Constraints (Instacart)

These constraints shaped every architectural decision:

1. **No Google Cloud Console access** — can't create OAuth Client IDs, API keys, or service account keys
2. **Apps Script deployment restricted** to "Anyone at instacart.com" (no public "Anyone" option)
3. **Superblocks blocked** — Google Drive integration requires OAuth credentials
4. **CORS blocks** cross-origin fetch from Superblocks to Apps Script (SSO redirect)

**Why AppSheet won:** It's a Google Workspace product that connects to Sheets natively, requires zero credentials, and works within Instacart's security perimeter.

---

## How to Continue Development

### Modifying Apps Script
1. Open the Google Sheet → Extensions → Apps Script
2. Edit the scripts in the browser editor
3. **Copy changes back** to this repo's `scripts/` directory (no auto-sync)
4. Consider using [clasp](https://github.com/google/clasp) for push/pull if the scripts evolve significantly

### Modifying AppSheet
1. Go to [appsheet.com](https://www.appsheet.com) → My Apps → ETSWIGManager
2. Changes are live immediately (AppSheet has its own versioning)
3. Document significant changes in this file

### Adding a New WIG or Manager
1. Update `CONFIG.MANAGERS` and `CONFIG.TABS.TEAMS` in `Config.gs`
2. Create the new team tab in the sheet (or re-run `setupWIGHub()`)
3. Update Dashboard formulas to reference the new tab
4. Add the new manager to `CONFIG.SLACK_USER_IDS`
5. Update `_Config` tab chair rotation list
6. In AppSheet: add the new table as a data source

### Redeploying WebApp.gs
1. In Apps Script editor: Deploy → Manage deployments
2. Click the pencil icon on the active deployment
3. Set version to "New version"
4. Click Deploy

---

## Weekly Automation Timeline

```
Monday  8 PM  → generateWeeklyRows()  → Creates 6 Commitment Log rows
Tuesday 7 AM  → rotateChair()         → Advances chair, updates Meeting tab
Tuesday 8 AM  → sendSmartReminder()   → Slack @mentions for incomplete entries
Tuesday       → Managers fill in Lag Result + Lead Commitment
Tuesday       → Meeting (chair runs agenda from Meeting tab)
After meeting → Managers update team tab scores and milestones
```
