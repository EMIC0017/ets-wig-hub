# ETS WIG Hub -- Google Sheet Setup Specification

> Build guide for manually constructing the Google Sheets workbook.
> Follow each section in order. After the sheet is built, paste in the Apps Script code from `scripts/`.

---

## Table of Contents

1. [Workbook Overview](#workbook-overview)
2. [Global Style Guide](#global-style-guide)
3. [Tab 1 -- Dashboard](#tab-1----dashboard)
4. [Tab 2 -- Commitment Log](#tab-2----commitment-log)
5. [Tab 3 -- Meeting](#tab-3----meeting)
6. [Tabs 4-9 -- Team Tabs](#tabs-4-9----team-tabs)
7. [Tab 10 -- _Config (Hidden)](#tab-10----_config-hidden)
8. [Post-Build Checklist](#post-build-checklist)

---

## Workbook Overview

| Property       | Value                                  |
| -------------- | -------------------------------------- |
| Workbook name  | ETS WIG Hub                            |
| Total tabs     | 10 (9 visible + 1 hidden)             |
| Visible tabs   | Dashboard, Commitment Log, Meeting, 6 team tabs |
| Hidden tabs    | _Config                                |
| Locale         | United States (for date formatting)    |
| Time zone      | Your organization's local time zone    |

### Tab Creation Order

Create tabs in this exact order so that gid values are available for hyperlinks:

| #  | Tab Name                    | Visible |
| -- | --------------------------- | ------- |
| 1  | Dashboard                   | Yes     |
| 2  | Commitment Log              | Yes     |
| 3  | Meeting                     | Yes     |
| 4  | WIG 1 --- Jira Mgmt        | Yes     |
| 5  | WIG 2 --- CSAT              | Yes     |
| 6  | WIG 3 --- Knowledge Mgmt   | Yes     |
| 7  | WIG 4 --- Track Work        | Yes     |
| 8  | WIG 5 --- Metrics           | Yes     |
| 9  | WIG 6 --- Incident Mgmt    | Yes     |
| 10 | _Config                     | No      |

> **Important:** Tab names must match exactly (including the em dash `---`). The scripts in `Config.gs` reference these literal names.

---

## Global Style Guide

| Element             | Value                                     |
| ------------------- | ----------------------------------------- |
| Header background   | `#1a1a2e` (dark navy)                     |
| Header text color   | `#ffffff` (white)                         |
| Header text weight  | Bold                                      |
| Section headers     | Bold, no background color                 |
| Key input cells     | `#fff9c4` (light yellow) background       |
| Body font           | Arial (Google Sheets default) or Roboto   |
| Body font size      | 10pt                                      |
| Tab title font size | 12pt (within-tab title text: 16pt)        |
| Gridlines           | Hidden on Dashboard (View > Show > uncheck Gridlines); optional elsewhere |
| Borders             | None unless specified; use alternating colors and whitespace for readability |

---

## Tab 1 -- Dashboard

The at-a-glance summary showing all 6 WIGs, their scores, targets, and trends.

### Layout

**Freeze:** Row 1 (View > Freeze > 1 row)

**Gridlines:** Hidden (View > Show > uncheck Gridlines)

### Column Specifications

| Column | Header         | Width  | Format / Notes                           |
| ------ | -------------- | ------ | ---------------------------------------- |
| A      | WIG            | 280px  | Hyperlink to team tab (see formulas)     |
| B      | Manager        | 100px  | Plain text                               |
| C      | Score          | 100px  | Auto or percentage (depends on WIG)      |
| D      | Target         | 100px  | Static text                              |
| E      | Trend          | 80px   | Manual entry: arrow symbols              |
| F      | Last Updated   | 140px  | Date format, auto via formula            |

### Row 1 -- Header Row

| Cell | Value          | Style                                           |
| ---- | -------------- | ----------------------------------------------- |
| A1   | WIG            | Bold, background `#1a1a2e`, text `#ffffff`      |
| B1   | Manager        | Bold, background `#1a1a2e`, text `#ffffff`      |
| C1   | Score          | Bold, background `#1a1a2e`, text `#ffffff`      |
| D1   | Target         | Bold, background `#1a1a2e`, text `#ffffff`      |
| E1   | Trend          | Bold, background `#1a1a2e`, text `#ffffff`      |
| F1   | Last Updated   | Bold, background `#1a1a2e`, text `#ffffff`      |

### Rows 2-7 -- WIG Data

| Row | Col A (WIG -- Hyperlink)                                                        | Col B (Manager) | Col C (Score Formula)               | Col D (Target) | Col E (Trend) | Col F (Last Updated Formula)              |
| --- | ------------------------------------------------------------------------------- | --------------- | ------------------------------------ | -------------- | ------------- | ----------------------------------------- |
| 2   | `=HYPERLINK("#gid=GID4", "1. Jira Management Process")`                        | Hassan          | `='WIG 1 — Jira Mgmt'!B3`          | 100%           | (manual)      | `='WIG 1 — Jira Mgmt'!B4`                |
| 3   | `=HYPERLINK("#gid=GID5", "2. CSAT")`                                           | Nikita          | `='WIG 2 — CSAT'!B3`               | 100%           | (manual)      | `='WIG 2 — CSAT'!B4`                     |
| 4   | `=HYPERLINK("#gid=GID6", "3. Knowledge Management")`                           | Alicia          | `='WIG 3 — Knowledge Mgmt'!B3`     | 1 Process      | (manual)      | `='WIG 3 — Knowledge Mgmt'!B4`           |
| 5   | `=HYPERLINK("#gid=GID7", "4. Track Untracked Work")`                           | Eric            | `='WIG 4 — Track Work'!B3`         | 80%            | (manual)      | `='WIG 4 — Track Work'!B4`               |
| 6   | `=HYPERLINK("#gid=GID8", "5. Sophistication of Metrics")`                      | Sunny           | `='WIG 5 — Metrics'!B3`            | 7 KPIs         | (manual)      | `='WIG 5 — Metrics'!B4`                  |
| 7   | `=HYPERLINK("#gid=GID9", "6. Incident Management")`                            | Jonathan        | `='WIG 6 — Incident Mgmt'!B3`      | 100%           | (manual)      | `='WIG 6 — Incident Mgmt'!B4`            |

> **GID placeholders:** Replace `GID4` through `GID9` with the actual `gid` values of each team tab. To find a tab's gid, click the tab and look at the URL: `...#gid=XXXXXXXXXX`. Copy that number.

> **Trend column (E):** Enter one of these Unicode arrows manually each week: `↑` (improving), `↓` (declining), `→` (flat). Alternatively, use a formula that compares the current score to a previous score if you track history.

### Conditional Formatting on Column C (Score)

Apply three conditional formatting rules to the range `C2:C7`. Create them in this order (highest priority first):

| Priority | Condition                                    | Background Color          | Text Color |
| -------- | -------------------------------------------- | ------------------------- | ---------- |
| 1        | Custom formula: cell value >= 75% of target  | `#c6efce` (light green)   | `#006100`  |
| 2        | Custom formula: cell value >= 50% of target  | `#ffeb9c` (light yellow)  | `#9c6500`  |
| 3        | Custom formula: cell value < 50% of target   | `#ffc7ce` (light red)     | `#9c0006`  |

> **Note on mixed target types:** WIGs 1, 2, 4, and 6 have percentage targets and work naturally with conditional formatting. WIGs 3 and 5 have text targets ("1 Process", "7 KPIs") which do not lend themselves to automatic conditional formatting. For those rows, either apply formatting manually or leave them unformatted. A practical approach is to apply rules only to cells `C2`, `C3`, `C5`, and `C7` (the percentage-based WIGs) using the formulas:
>
> - Green: `=C2>=0.75` (for 100% targets) or `=C5>=0.6` (for the 80% target)
> - Yellow: `=C2>=0.5`
> - Red: `=C2<0.5`

---

## Tab 2 -- Commitment Log

The weekly accountability log. Each week the scripts auto-generate 6 rows (one per manager). Managers fill in their lag result and lead commitment before the Tuesday meeting.

### Layout

**Freeze:** Row 1 (View > Freeze > 1 row)

### Column Specifications

| Column | Header                     | Width  | Format                  | Wrap Text |
| ------ | -------------------------- | ------ | ----------------------- | --------- |
| A      | Week Ending                | 120px  | Date: `MMM d, yyyy`    | No        |
| B      | Manager                    | 100px  | Plain text              | No        |
| C      | WIG                        | 200px  | Plain text              | No        |
| D      | Lag Result (Last Week)     | 350px  | Plain text              | Yes       |
| E      | Lead Commitment (This Week)| 350px  | Plain text              | Yes       |

### Row 1 -- Header Row

| Cell | Value                        | Style                                           |
| ---- | ---------------------------- | ----------------------------------------------- |
| A1   | Week Ending                  | Bold, background `#1a1a2e`, text `#ffffff`      |
| B1   | Manager                      | Bold, background `#1a1a2e`, text `#ffffff`      |
| C1   | WIG                          | Bold, background `#1a1a2e`, text `#ffffff`      |
| D1   | Lag Result (Last Week)       | Bold, background `#1a1a2e`, text `#ffffff`      |
| E1   | Lead Commitment (This Week)  | Bold, background `#1a1a2e`, text `#ffffff`      |

### Data Rows

Leave rows 2+ empty. The `generateWeeklyRows()` function in `WeeklySetup.gs` auto-populates them every week:

- **Column A:** Week-ending date (the Tuesday meeting date), formatted `MMM d, yyyy`
- **Column B:** Manager name
- **Column C:** WIG number and name (e.g., `1. Jira Management Process`)
- **Columns D-E:** Left blank for managers to fill in before the meeting

Each week generates a block of 6 rows (one per manager) with a blank separator row above it.

### Alternating Row Colors (Optional)

To visually separate weekly blocks, apply alternating background colors in groups of 6 rows:

- Odd weeks: no background (white)
- Even weeks: `#f5f5f5` (very light gray)

This is cosmetic and can be applied manually after data accumulates, or skipped entirely.

### Script Dependencies

| Script            | Reads                  | Writes              |
| ----------------- | ---------------------- | ------------------- |
| WeeklySetup.gs    | --                     | Columns A-E (rows)  |
| SlackReminder.gs  | Columns D-E (checks for empty cells) | --   |

---

## Tab 3 -- Meeting

The agenda sheet used during the weekly WIG accountability meeting. Scripts auto-fill the meeting date (B1) and chair name (B2).

### Layout

**No frozen rows.** This tab is used as a single-page agenda.

### Row-by-Row Specification

| Row(s)  | Col A                           | Col B                                         | Col C                              | Col D-E        | Style / Notes                          |
| ------- | ------------------------------- | --------------------------------------------- | ---------------------------------- | -------------- | -------------------------------------- |
| 1       | `Meeting Date`                  | *(date -- auto-set by script)*                | --                                 | --             | A1: bold. B1: date format `MMM d, yyyy` |
| 2       | `Chair`                         | *(name -- auto-set by script)*                | --                                 | --             | A2: bold. B2: plain text               |
| 3       | *(blank separator)*             |                                               |                                    |                |                                        |
| 4       | `Attendance`                    |                                               |                                    |                | A4: **bold, section header**           |
| 5       | Hassan                          | ☐ *(checkbox)*                                |                                    |                | B5: Insert > Checkbox                  |
| 6       | Nikita                          | ☐ *(checkbox)*                                |                                    |                | B6: Insert > Checkbox                  |
| 7       | Alicia                          | ☐ *(checkbox)*                                |                                    |                | B7: Insert > Checkbox                  |
| 8       | Eric                            | ☐ *(checkbox)*                                |                                    |                | B8: Insert > Checkbox                  |
| 9       | Sunny                           | ☐ *(checkbox)*                                |                                    |                | B9: Insert > Checkbox                  |
| 10      | Jonathan                        | ☐ *(checkbox)*                                |                                    |                | B10: Insert > Checkbox                 |
| 11      | *(blank separator)*             |                                               |                                    |                |                                        |
| 12      | `Scoreboard Snapshot`           |                                               |                                    |                | A12: **bold, section header**          |
| 13      | 1. Jira Management Process      | `=Dashboard!C2`                               | `=Dashboard!E2`                    |                | Score + Trend from Dashboard           |
| 14      | 2. CSAT                         | `=Dashboard!C3`                               | `=Dashboard!E3`                    |                |                                        |
| 15      | 3. Knowledge Management          | `=Dashboard!C4`                               | `=Dashboard!E4`                    |                |                                        |
| 16      | 4. Track Untracked Work          | `=Dashboard!C5`                               | `=Dashboard!E5`                    |                |                                        |
| 17      | 5. Sophistication of Metrics     | `=Dashboard!C6`                               | `=Dashboard!E6`                    |                |                                        |
| 18      | 6. Incident Management           | `=Dashboard!C7`                               | `=Dashboard!E7`                    |                |                                        |
| 19      | *(blank separator)*             |                                               |                                    |                |                                        |
| 20      | `Any Other Business`            |                                               |                                    |                | A20: **bold, section header**          |
| 21-23   | *(freeform notes)*              |                                               |                                    |                | Merge A21:E23 into one large cell      |
| 24      | *(blank separator)*             |                                               |                                    |                |                                        |
| 25      | `Next Chair`                    | *(auto-filled or dropdown)*                   |                                    |                | A25: bold. B25: see note below         |

### Cell B25 -- Next Chair

Option A (recommended): Leave B25 empty. The `rotateChair()` script writes the next chair name to B2 at the start of each week, so B25 can be used as a manual reference or left blank.

Option B: Add a data validation dropdown with the 6 manager names (Hassan, Nikita, Alicia, Eric, Sunny, Jonathan) for manual override.

### Column Widths

| Column | Width |
| ------ | ----- |
| A      | 250px |
| B      | 150px |
| C      | 80px  |
| D      | 200px |
| E      | 200px |

### Script Dependencies

| Script             | Cell  | Action                               |
| ------------------ | ----- | ------------------------------------ |
| ChairRotation.gs   | B1    | Writes the meeting date (Tuesday)    |
| ChairRotation.gs   | B2    | Writes the next chair's name         |

---

## Tabs 4-9 -- Team Tabs

Six tabs with identical structure, one per WIG. Create each with the exact tab name listed below.

### Tab Names and Data

| Tab # | Exact Tab Name               | WIG Full Name                    | Manager  | Target    |
| ----- | ---------------------------- | -------------------------------- | -------- | --------- |
| 4     | `WIG 1 — Jira Mgmt`         | Jira Management Process          | Hassan   | 100%      |
| 5     | `WIG 2 — CSAT`              | CSAT                             | Nikita   | 100%      |
| 6     | `WIG 3 — Knowledge Mgmt`    | Knowledge Management             | Alicia   | 1 Process |
| 7     | `WIG 4 — Track Work`        | Track Untracked Work             | Eric     | 80%       |
| 8     | `WIG 5 — Metrics`           | Sophistication of Metrics        | Sunny    | 7 KPIs    |
| 9     | `WIG 6 — Incident Mgmt`     | Incident Management              | Jonathan | 100%      |

> **Tab name character:** The dash between the WIG number and the short name is an **em dash** (`---`), Unicode U+2014. To type it: on macOS press `Option+Shift+Hyphen`; on Windows use `Alt+0151`; or copy-paste from this document.

### Row-by-Row Specification (Identical for All 6 Tabs)

| Row(s) | Col A                  | Col B                              | Col C          | Col D   | Style / Notes                                         |
| ------ | ---------------------- | ---------------------------------- | -------------- | ------- | ----------------------------------------------------- |
| 1      | WIG full name          |                                    |                |         | Merge A1:D1. Bold, 16pt font size                     |
| 2      | `Manager:`             | Manager name                       |                |         | A2: bold label. B2: plain text                         |
| 3      | `Current Score:`       | *(editable -- key input)*          |                |         | A3: bold label. B3: background `#fff9c4` (light yellow)|
| 4      | `Last Updated:`        | `=IF(B3<>"", TODAY(), "")`         |                |         | A4: bold label. B4: date format, auto-calculated       |
| 5      | `Target:`              | Target value                       |                |         | A5: bold label. B5: plain text                         |
| 6      | *(blank separator)*    |                                    |                |         |                                                        |
| 7      | `Milestones`           |                                    |                |         | Merge A7:D7. **Bold, section header**                  |
| 8      | `Milestone`            | `Status`                           | `Target Date`  | `Notes` | Bold header row. Optionally apply `#1a1a2e` background with white text |
| 9+     | *(empty rows for data)*|                                    |                |         | Leave 10-15 empty rows for milestone entries           |

### Column Widths (Team Tabs)

| Column | Width |
| ------ | ----- |
| A      | 250px |
| B      | 140px |
| C      | 120px |
| D      | 300px |

### Cell B3 -- Current Score (Critical Cell)

This is the single most important input cell per team tab. The Dashboard pulls its score from this cell.

- Background: `#fff9c4` (light yellow)
- Border: optional thin border to draw attention
- Format: percentage for WIGs 1, 2, 4, 6; plain text for WIGs 3, 5
- Leave it empty initially; the WIG manager updates it before each meeting

### Cell B4 -- Last Updated (Auto-Calculated)

Formula: `=IF(B3<>"", TODAY(), "")`

This returns today's date whenever B3 contains a value, and stays blank when B3 is empty. The Dashboard pulls this value into its "Last Updated" column.

> **Note:** `TODAY()` recalculates each time the sheet opens. If you need a static timestamp instead (the date when B3 was last edited), replace this formula with an `onEdit` trigger in Apps Script.

### Data Validation on Status Column (Column B, Rows 9+)

Apply data validation to `B9:B50` (or however many milestone rows you want):

| Setting              | Value                                    |
| -------------------- | ---------------------------------------- |
| Criteria             | List of items                            |
| Values               | `Not Started`, `In Progress`, `Complete` |
| On invalid data      | Show warning                             |
| Show dropdown        | Yes                                      |

### Conditional Formatting on Status Column (Column B, Rows 9+)

Apply to range `B9:B50`:

| Priority | Condition             | Background Color          | Text Color              |
| -------- | --------------------- | ------------------------- | ----------------------- |
| 1        | Text is `Complete`    | `#c6efce` (light green)   | `#006100` (dark green)  |
| 2        | Text is `In Progress` | `#fff9c4` (light yellow)  | `#9c6500` (dark amber)  |
| 3        | Text is `Not Started` | `#ffc7ce` (light red)     | `#9c0006` (dark red)    |

### Script Dependencies

| Script / Tab   | Cell | Action                             |
| -------------- | ---- | ---------------------------------- |
| Dashboard      | B3   | Referenced by `='TAB NAME'!B3`     |
| Dashboard      | B4   | Referenced by `='TAB NAME'!B4`     |

> The scripts themselves do not write to team tabs. The Dashboard reads from them via formulas.

---

## Tab 10 -- _Config (Hidden)

Internal configuration tab used by the `ChairRotation.gs` script to track whose turn it is to chair the meeting.

### Layout

| Row | Col A                  | Col B                    | Notes                                  |
| --- | ---------------------- | ------------------------ | -------------------------------------- |
| 1   | `Chair Rotation`       |                          | **Bold header**                        |
| 2   | Hassan                 | `X`                      | Initial marker -- Hassan chairs first  |
| 3   | Nikita                 |                          |                                        |
| 4   | Alicia                 |                          |                                        |
| 5   | Eric                   |                          |                                        |
| 6   | Sunny                  |                          |                                        |
| 7   | Jonathan               |                          |                                        |

### How It Works

- The script reads `A2:B7` to find the row marked with `X` in column B.
- It advances the `X` to the next row (wrapping from row 7 back to row 2).
- The manager names in A2:A7 must match the names in `Config.gs` exactly.

### Hiding the Tab

After entering all data:

1. Right-click the `_Config` tab at the bottom of the sheet.
2. Select **Hide sheet**.

To unhide later: go to **View > Hidden sheets > _Config**.

---

## Post-Build Checklist

Run through this checklist after building all 10 tabs to verify everything is wired up correctly.

### Tab Names

- [ ] Dashboard tab is named exactly `Dashboard`
- [ ] Commitment Log tab is named exactly `Commitment Log`
- [ ] Meeting tab is named exactly `Meeting`
- [ ] Team tabs are named exactly:
  - [ ] `WIG 1 — Jira Mgmt`
  - [ ] `WIG 2 — CSAT`
  - [ ] `WIG 3 — Knowledge Mgmt`
  - [ ] `WIG 4 — Track Work`
  - [ ] `WIG 5 — Metrics`
  - [ ] `WIG 6 — Incident Mgmt`
- [ ] _Config tab is named exactly `_Config`
- [ ] _Config tab is hidden

### Formulas

- [ ] Dashboard C2:C7 each reference the correct team tab's B3 cell
- [ ] Dashboard F2:F7 each reference the correct team tab's B4 cell
- [ ] Dashboard A2:A7 hyperlinks work (replace GID placeholders with actual tab gids)
- [ ] Each team tab B4 contains `=IF(B3<>"", TODAY(), "")`
- [ ] Meeting B13:B18 reference Dashboard C2:C7
- [ ] Meeting C13:C18 reference Dashboard E2:E7

### Data Validation

- [ ] Each team tab has Status dropdown in column B (rows 9+)
- [ ] Meeting tab has checkboxes in B5:B10

### Conditional Formatting

- [ ] Dashboard C2:C7 has green/yellow/red rules
- [ ] Each team tab Status column has green/yellow/red rules

### Styling

- [ ] All header rows use `#1a1a2e` background with white text
- [ ] All team tab B3 cells have `#fff9c4` background
- [ ] Dashboard gridlines are hidden
- [ ] Row 1 is frozen on Dashboard and Commitment Log

### _Config Tab

- [ ] A2:A7 contain the 6 manager names in order
- [ ] B2 contains `X` (initial chair marker)
- [ ] B3:B7 are empty

### Apps Script

After the sheet structure is verified:

- [ ] Open Extensions > Apps Script
- [ ] Create one file per script: `Config.gs`, `Utilities.gs`, `WeeklySetup.gs`, `SlackReminder.gs`, `ChairRotation.gs`
- [ ] Paste the contents from the `scripts/` directory
- [ ] Update `SLACK_WEBHOOK_URL` in `Config.gs` with your actual Slack webhook
- [ ] Update `SLACK_USER_IDS` in `Config.gs` with actual Slack user IDs
- [ ] Set up three time-driven triggers:
  - `generateWeeklyRows` — every Monday at 8–9 PM
  - `rotateChair` — every Tuesday at 7–8 AM
  - `sendSmartReminder` — every Tuesday at 8–9 AM
