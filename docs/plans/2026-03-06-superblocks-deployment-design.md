# Superblocks Deployment Design

**Date:** 2026-03-06
**Status:** Approved
**Supersedes:** 2026-03-06-github-pages-deployment-design.md

## Context

The ETS WIG Hub dashboard cannot be deployed via GitHub Pages or AWS because Instacart restricts access to Google Cloud credentials (OAuth Client ID, API Key). Since Superblocks is already available internally with Google Sheets integration and SSO auth, it is the simplest path to a working deployment.

The existing React + Vite frontend code will not be reused. The app will be rebuilt as a native Superblocks application.

## Architecture

A Superblocks application connected to the existing ETS WIG Hub Google Sheet. The Apps Script automations (Slack reminders, weekly row generation, chair rotation) continue running independently on the sheet.

- **Hosting:** Superblocks (internal, already available)
- **Auth:** Instacart SSO via Superblocks (no Google OAuth needed)
- **Data source:** Google Sheets (via Superblocks' built-in integration)
- **No backend, no Terraform, no custom credentials**

## Pages

### Dashboard
- 6 donut charts in a 2x3 or 3x2 grid, one per WIG
- Each chart shows % progress toward target with the percentage in the center
- Color-coded: green (on track), yellow (at risk), red (behind)
- Summary table below: WIG name, owner, current score, target, status

### WIG Detail
- Selected WIG's donut chart (larger)
- Score editor (update current score)
- Milestone table (view/edit milestones)
- Commitment history (past entries from Commitment Log)
- Commitment form (add this week's lag result and lead commitment)

### Meeting
- Current chair display (from Meeting tab cell B2)
- Attendance checklist (checkboxes for each manager)
- AOB notes text field
- This week's commitment log entries (read-only summary)

## Data Flow

### Read
Superblocks queries these Google Sheet tabs:
- **Dashboard** tab: WIG scores and targets
- **Commitment Log** tab: Weekly commitment entries
- **Meeting** tab: Chair, attendance, AOB
- **Team tabs** (Hassan, Nikita, etc.): Individual WIG milestones and scores

### Write
- Score updates write to team tabs
- Commitment entries write to Commitment Log
- Attendance and AOB write to Meeting tab

### Apps Script (unchanged)
- `generateWeeklyRows` — Monday 8 PM, creates Commitment Log rows
- `rotateChair` — Tuesday 7 AM, updates Meeting tab
- `sendSmartReminder` — Tuesday 8 AM, Slack reminder for missing entries

## Visualization

Donut charts replace the original concentric rings SVG. Each WIG gets its own donut chart rather than all 6 being stacked in one visualization. This improves per-WIG readability while maintaining the "at a glance" visual feel.

## What Stays the Same

- The Google Sheet remains the single source of truth
- All Apps Script automations keep running
- The weekly workflow (Monday auto-rows, Tuesday reminders, meeting flow) is unchanged
- WIG owners, targets, and data structure are unchanged

## What Changes

- Frontend moves from custom React app to Superblocks native components
- Auth moves from Google OAuth to Instacart SSO
- Concentric rings replaced with individual donut charts
- No infrastructure to manage (no S3, CloudFront, GitHub Pages, etc.)
