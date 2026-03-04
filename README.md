# ETS WIG Hub

Central tracking system for ETS Wildly Important Goals.

> **Mission:** Go from 0 to 6 mature process workflows in ETS by June 30, 2026.

---

## What's In This Repo

| File | Purpose |
|------|---------|
| `scripts/Setup.gs` | `setupWIGHub` — **run once** to build all 10 tabs, formulas, formatting, and validation |
| `scripts/Config.gs` | Centralized constants: tab names, manager list, Slack settings, column indices |
| `scripts/Utilities.gs` | Date helpers (`getCurrentWeekEnding`, `formatDateShort`, `formatDateISO`) and sheet accessors |
| `scripts/WeeklySetup.gs` | `generateWeeklyRows` — auto-creates 6 Commitment Log rows each Monday evening |
| `scripts/SlackReminder.gs` | `sendSmartReminder` — sends a targeted Slack message tagging only managers with missing entries |
| `scripts/ChairRotation.gs` | `rotateChair` — advances the meeting chair each week and updates the Meeting tab |
| `SHEET_SETUP.md` | Tab-by-tab reference spec (used by Setup.gs; also useful for manual verification) |
| `README.md` | This file — setup and usage instructions |

---

## Quick Start

1. Create a new Google Sheet named **ETS WIG Hub**
2. Open **Extensions > Apps Script**
3. In the Script Editor, create 6 files: `Config`, `Setup`, `Utilities`, `WeeklySetup`, `SlackReminder`, `ChairRotation`
4. Copy-paste each `.gs` file's contents from this repo into the matching Apps Script file
5. **Run `setupWIGHub()`** from the editor — this builds all 10 tabs with headers, formulas, formatting, and validation automatically
6. Update `CONFIG.SLACK_WEBHOOK_URL` with your Slack webhook URL (see [Slack Webhook Setup](#slack-webhook-setup))
7. Update `CONFIG.SLACK_USER_IDS` with real Slack user IDs (see [Finding Slack User IDs](#finding-slack-user-ids))
8. Set up time triggers (see [Trigger Configuration](#trigger-configuration))

---

## Slack Webhook Setup

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click **Create New App > From scratch**
2. Name the app (e.g., "WIG Hub Bot") and select your workspace
3. In the left sidebar, click **Incoming Webhooks** and toggle it **On**
4. Click **Add New Webhook to Workspace** and select your target channel
5. Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)
6. Paste it into `Config.gs` as the value for `CONFIG.SLACK_WEBHOOK_URL`

---

## Finding Slack User IDs

Each manager needs a Slack user ID so the reminder can @mention them directly.

**Option A — From the Slack app:**
1. Click on a user's profile picture
2. Click **More** (three dots)
3. Click **Copy member ID**

**Option B — Via the Slack API:**
- Use [users.list](https://api.slack.com/methods/users.list) to retrieve all user IDs in your workspace

Paste each ID into the `CONFIG.SLACK_USER_IDS` object in `Config.gs`:

```js
SLACK_USER_IDS: {
  'Hassan':   'U01ABC1234',
  'Nikita':   'U01DEF5678',
  // ...
}
```

---

## Trigger Configuration

1. In the Apps Script editor, click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger** and create the following 3 triggers:

| Function | Event Source | Trigger Type | Day | Time |
|----------|-------------|--------------|-----|------|
| `generateWeeklyRows` | Time-driven | Week timer | Monday | 8–9 PM |
| `rotateChair` | Time-driven | Week timer | Tuesday | 7–8 AM |
| `sendSmartReminder` | Time-driven | Week timer | Tuesday | 8–9 AM |

> **Note:** `rotateChair` must run before `sendSmartReminder` so the Meeting tab has the current chair before any Slack message is sent.

---

## Weekly Workflow

### Monday 8 PM (automatic)
- `generateWeeklyRows` creates 6 new rows in the Commitment Log (one per manager) for the upcoming Tuesday meeting

### Tuesday 7 AM (automatic)
- `rotateChair` selects the next meeting chair and updates the Meeting tab (cell B2)

### Tuesday 8 AM (automatic)
- `sendSmartReminder` checks who hasn't filled in their Lag Result and Lead Commitment, then sends a Slack message tagging only those managers

### Before the meeting (manual)
- Each manager fills in their **Lag Result** and **Lead Commitment** in the Commitment Log

### During the meeting
- Chair runs the Meeting tab agenda:
  1. Attendance
  2. Scoreboard review
  3. Individual updates (each manager reports on their WIG)
  4. AOB (Any Other Business)
  5. Confirm next week's chair

### After the meeting
- Each manager updates their team tab score and milestones as needed

---

## WIG Owners

| WIG | Manager | Goal | Target |
|-----|---------|------|--------|
| 1 | Hassan | Jira Management Process | 100% |
| 2 | Nikita | CSAT | 100% |
| 3 | Alicia | Knowledge Management | 1 Process |
| 4 | Eric | Track Untracked Work | 80% |
| 5 | Sunny | Sophistication of Metrics | 7 KPIs |
| 6 | Jonathan | Incident Management | 100% |
