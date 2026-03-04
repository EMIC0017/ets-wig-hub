# ETS WIG Hub Dashboard — Frontend Design

**Date:** 2026-03-02
**Status:** Approved

## Problem

The ETS leadership team needs a visual, interactive dashboard for their weekly WIG accountability meetings — not just a spreadsheet. The dashboard should display progress at a glance with concentric ring visualizations, show commitment status, and allow write-back to the Google Sheet.

## Solution

A React single-page app that reads from and writes to the existing Google Sheet via the Sheets API with Google OAuth. Deployed as static files to GitHub Pages or Vercel.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Visualization | Custom SVG concentric rings |
| Data | Google Sheets API v4 (read + write) |
| Auth | Google Identity Services (OAuth 2.0) |
| Hosting | Static deploy (GitHub Pages / Vercel / Netlify) |

## Team Color Scheme

| WIG | Manager | Color | Hex |
|-----|---------|-------|-----|
| 1. Jira Mgmt | Hassan | Blue | #3B82F6 |
| 2. CSAT | Nikita | Emerald | #10B981 |
| 3. Knowledge Mgmt | Alicia | Purple | #8B5CF6 |
| 4. Track Work | Eric | Amber | #F59E0B |
| 5. Metrics | Sunny | Rose | #F43F5E |
| 6. Incident Mgmt | Jonathan | Cyan | #06B6D4 |

## Layout

Linear-inspired three-panel layout:

- **Left sidebar:** Navigation — Dashboard, 6 WIG team links, Meeting view
- **Main area:** Concentric rings visualization + dashboard table
- **Right panel:** Commitment status table (green check / red X per team)

## Concentric Rings Component

- 6 SVG arc rings, outermost = WIG 1, innermost = WIG 6
- Each ring fills clockwise proportional to score percentage
- Unfilled portion: faded version of team color (20% opacity)
- Hover: tooltip with WIG name, manager, score/target
- Click: navigates to WIG detail view
- Center: overall progress label (e.g., "4/6 on track")

## Right Panel — Commitment Status

| Team (in team color) | Last Week (Lag) | This Week (Lead) |
|----------------------|-----------------|------------------|
| Jira Mgmt | green check / red X | green check / red X |

- Green check = Commitment Log entry exists (cell not empty)
- Red X = entry missing
- Data: Commitment Log tab, current week's rows, columns D and E

## Views

### 1. Dashboard (default)

- Concentric rings visualization
- Summary table: WIG, Manager, Score, Target, Trend, Last Updated (from Dashboard tab)
- Right panel: commitment status

### 2. WIG Detail (click ring or sidebar)

- Team score display with inline edit (writes to team tab B3)
- Milestone table with status dropdowns (writes to team tab B9:B23)
- Commitment history — last 4 weeks of lag/lead entries (read from Commitment Log)
- Current week commitment form: lag result + lead commitment (writes to Commitment Log columns D, E)

### 3. Meeting View (sidebar)

- Attendance checkboxes (writes to Meeting tab B5:B10)
- Scoreboard snapshot (read from Dashboard tab)
- AOB notes textarea (writes to Meeting tab A21:E23)
- Next Chair dropdown selector (writes to Meeting tab B25)

## Authentication

- Google Identity Services (GIS) library
- OAuth 2.0 implicit flow (no backend needed)
- Scopes: `https://www.googleapis.com/auth/spreadsheets`
- OAuth client ID from Google Cloud Console
- Sheet ID stored as environment variable

## Data Flow

```
Google Sheet (source of truth)
    ↑↓ Sheets API v4 (OAuth token)
React App (static files on GitHub Pages / Vercel)
    ↑↓ renders / captures user input
Browser (team members)
```

## Write-Back Actions

| Action | Sheet Tab | Cell(s) |
|--------|-----------|---------|
| Update lag result | Commitment Log | Column D, manager's row |
| Update lead commitment | Commitment Log | Column E, manager's row |
| Update team score | Team tab (1-6) | B3 |
| Update milestone status | Team tab (1-6) | B9:B23 column B |
| Mark attendance | Meeting | B5:B10 |
| Add AOB notes | Meeting | A21:E23 (merged) |
| Select next chair | Meeting | B25 |

## Project Structure

```
ets-wig-hub-dashboard/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, MainArea, RightPanel
│   │   ├── rings/           # ConcentricRings, RingArc, RingTooltip
│   │   ├── dashboard/       # DashboardTable, CommitmentStatus
│   │   ├── detail/          # WigDetail, MilestoneTable, CommitmentForm
│   │   └── meeting/         # AttendanceList, AOBNotes, ChairSelector
│   ├── hooks/
│   │   ├── useSheets.js     # Google Sheets API read/write
│   │   └── useAuth.js       # Google OAuth flow
│   ├── config/
│   │   └── teams.js         # Team colors, names, targets (mirrors Config.gs)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Design Decisions

- **Custom SVG rings over chart library:** D3/Chart.js are overkill for 6 arcs. Custom SVG keeps bundle small and gives full control over interactions.
- **Google OAuth in-browser:** No backend needed. The Sheets API supports browser-only OAuth with CORS. Keeps hosting static.
- **Tailwind CSS:** Matches the Linear-like minimal aesthetic. Utility-first means fast iteration on layout.
- **React Router for views:** Dashboard, WIG detail, and Meeting are separate routes. Clean URL structure, browser back/forward works.

## Out of Scope

- Real-time collaboration (no WebSocket sync between users)
- Offline mode
- Mobile-specific layout (responsive but desktop-first)
- User roles / permissions (all authenticated users can read and write)
