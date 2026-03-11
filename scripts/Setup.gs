/**
 * Setup.gs — ETS WIG Hub Automated Sheet Builder
 *
 * Creates the entire WIG Hub workbook structure from scratch.
 * Requires Config.gs to be present in the same Apps Script project.
 *
 * Usage:
 *   1. Create a blank Google Sheet.
 *   2. Open Extensions > Apps Script.
 *   3. Paste Config.gs and Setup.gs into separate script files.
 *   4. Run setupWIGHub() from the editor.
 *   5. The full 10-tab workbook is ready.
 */


// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Builds the entire ETS WIG Hub workbook: 10 tabs with headers, formulas,
 * conditional formatting, data validation, and styling.
 */
function setupWIGHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // -- Step 1: Create all tabs in order -----------------------------------------------
  Logger.log('Creating tabs...');
  const dashboardSheet     = createTab(ss, CONFIG.TABS.DASHBOARD);
  const commitmentLogSheet = createTab(ss, CONFIG.TABS.COMMITMENT_LOG);
  const meetingSheet       = createTab(ss, CONFIG.TABS.MEETING);

  const teamSheets = CONFIG.TABS.TEAMS.map(function(tabName) {
    return createTab(ss, tabName);
  });

  const configSheet = createTab(ss, CONFIG.TABS.CONFIG);

  // -- Step 2: Remove default "Sheet1" if it exists -----------------------------------
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
    Logger.log('Deleted default "Sheet1".');
  }

  // -- Step 3: Build each tab ---------------------------------------------------------
  Logger.log('Setting up Dashboard...');
  buildDashboard(ss, dashboardSheet, teamSheets);

  Logger.log('Setting up Commitment Log...');
  buildCommitmentLog(commitmentLogSheet);

  Logger.log('Setting up Meeting...');
  buildMeeting(meetingSheet);

  Logger.log('Setting up team tabs...');
  CONFIG.MANAGERS.forEach(function(manager, i) {
    buildTeamTab(teamSheets[i], manager);
  });

  Logger.log('Setting up _Config...');
  buildConfigTab(configSheet);

  // -- Step 4: Final touches ----------------------------------------------------------
  ss.setActiveSheet(dashboardSheet);
  Logger.log('ETS WIG Hub setup complete!');
  ss.toast('WIG Hub setup complete! All 10 tabs created.', 'Setup Done', 5);
}


// ---------------------------------------------------------------------------
// Helper: create a tab (or return existing one)
// ---------------------------------------------------------------------------

/**
 * Creates a new sheet with the given name, or returns the existing sheet
 * if it already exists (idempotent).
 *
 * @param {Spreadsheet} ss - The active spreadsheet.
 * @param {string} name - Desired tab name.
 * @returns {Sheet} The created or existing sheet.
 */
function createTab(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) {
    Logger.log('Tab "' + name + '" already exists — skipping creation.');
    return sheet;
  }
  sheet = ss.insertSheet(name);
  Logger.log('Created tab: ' + name);
  return sheet;
}


// ---------------------------------------------------------------------------
// Helper: apply header style
// ---------------------------------------------------------------------------

/**
 * Applies the standard header style to a range:
 * background #1a1a2e, white bold text.
 *
 * @param {Range} range - The range to style.
 */
function applyHeaderStyle(range) {
  range
    .setBackground('#1a1a2e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}


// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function buildDashboard(ss, sheet, teamSheets) {
  // -- Header row --
  const headers = ['WIG', 'Manager', 'Score', 'Target', 'Trend', 'Last Updated'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  applyHeaderStyle(headerRange);

  // Freeze row 1 and hide gridlines
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);

  // Column widths: A=280, B=100, C=100, D=100, E=80, F=140
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 80);
  sheet.setColumnWidth(6, 140);

  // -- Rows 2-7: WIG data --
  CONFIG.MANAGERS.forEach(function(manager, i) {
    const row = i + 2; // rows 2 through 7
    const tabName = CONFIG.TABS.TEAMS[i];
    const teamSheet = teamSheets[i];
    const gid = teamSheet.getSheetId();
    const wigLabel = manager.wig + '. ' + manager.wigName;

    // Col A: hyperlink to team tab
    sheet.getRange(row, 1).setFormula(
      '=HYPERLINK("#gid=' + gid + '", "' + wigLabel + '")'
    );

    // Col B: manager name
    sheet.getRange(row, 2).setValue(manager.name);

    // Col C: score formula referencing team tab B3
    sheet.getRange(row, 3).setFormula("='" + tabName + "'!B3");

    // Col D: target
    sheet.getRange(row, 4).setValue(manager.target);

    // Col E: trend arrow — auto-calculated from current score vs _Config previous score
    // For percentage WIGs: compare numerically with magnitude thresholds
    // For text WIGs: always show "→" (no numeric comparison possible)
    if (manager.targetType === 'percent') {
      // _Config D column holds previous score; row matches (2+i)
      var configRef = "'_Config'!D" + (2 + i);
      // Formula: if no previous score, show →; else compare with 5% threshold for big change
      sheet.getRange(row, 5).setFormula(
        '=IF(OR(' + configRef + '="",' + configRef + '=0),"→",' +
        'IF(C' + row + '-' + configRef + '>0.05,"⬆",' +
        'IF(C' + row + '-' + configRef + '>0,"↗",' +
        'IF(C' + row + '-' + configRef + '<-0.05,"⬇",' +
        'IF(C' + row + '-' + configRef + '<0,"↘","→")))))'
      );
    } else {
      sheet.getRange(row, 5).setValue('→');
    }

    // Col F: last updated formula referencing team tab B4
    sheet.getRange(row, 6).setFormula("='" + tabName + "'!B4");
  });

  // -- Conditional formatting on score column (percentage-type WIGs only) --
  // Percentage WIGs are at rows 2, 3, 5, 7 (WIGs 1, 2, 4, 6)
  const percentRows = [];
  CONFIG.MANAGERS.forEach(function(manager, i) {
    if (manager.targetType === 'percent') {
      percentRows.push(i + 2);
    }
  });

  // Build range list for percentage rows in column C
  const ranges = percentRows.map(function(row) {
    return sheet.getRange(row, 3); // column C
  });

  // Green: >= 0.75
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(0.75)
    .setBackground('#c6efce')
    .setFontColor('#006100')
    .setRanges(ranges)
    .build();

  // Yellow: >= 0.5
  const yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(0.5)
    .setBackground('#ffeb9c')
    .setFontColor('#9c6500')
    .setRanges(ranges)
    .build();

  // Red: < 0.5
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0.5)
    .setBackground('#ffc7ce')
    .setFontColor('#9c0006')
    .setRanges(ranges)
    .build();

  // Apply score rules (green first = highest priority)
  var allRules = sheet.getConditionalFormatRules();
  allRules = allRules.concat([greenRule, yellowRule, redRule]);

  // -- Conditional formatting on Trend column (E2:E7) --
  var trendRange = [sheet.getRange('E2:E7')];

  // Big improvement: ⬆ = dark green
  var trendBigUp = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('⬆')
    .setFontColor('#006100')
    .setRanges(trendRange)
    .build();

  // Small improvement: ↗ = light green
  var trendSmallUp = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('↗')
    .setFontColor('#38a169')
    .setRanges(trendRange)
    .build();

  // No change: → = gray
  var trendFlat = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('→')
    .setFontColor('#718096')
    .setRanges(trendRange)
    .build();

  // Small decline: ↘ = orange
  var trendSmallDown = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('↘')
    .setFontColor('#dd6b20')
    .setRanges(trendRange)
    .build();

  // Big decline: ⬇ = red
  var trendBigDown = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('⬇')
    .setFontColor('#9c0006')
    .setRanges(trendRange)
    .build();

  allRules = allRules.concat([trendBigUp, trendSmallUp, trendFlat, trendSmallDown, trendBigDown]);
  sheet.setConditionalFormatRules(allRules);
}


// ---------------------------------------------------------------------------
// Commitment Log
// ---------------------------------------------------------------------------

function buildCommitmentLog(sheet) {
  // -- Header row --
  const headers = [
    'Week Ending',
    'Manager',
    'WIG',
    'Lag Result (Last Week)',
    'Lead Commitment (This Week)'
  ];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  applyHeaderStyle(headerRange);

  // Freeze row 1
  sheet.setFrozenRows(1);

  // Column widths: A=120, B=100, C=200, D=350, E=350
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 350);
  sheet.setColumnWidth(5, 350);

  // Wrap text on columns D and E (rows 1-200)
  sheet.getRange('D1:E200').setWrap(true);
}


// ---------------------------------------------------------------------------
// Meeting
// ---------------------------------------------------------------------------

function buildMeeting(sheet) {
  // Row 1: Meeting Date
  sheet.getRange('A1').setValue('Meeting Date').setFontWeight('bold');
  // B1 left empty (script fills it)

  // Row 2: Chair
  sheet.getRange('A2').setValue('Chair').setFontWeight('bold');
  // B2 left empty (script fills it)

  // Row 3: blank

  // Row 4: Attendance section header
  sheet.getRange('A4').setValue('Attendance').setFontWeight('bold');

  // Rows 5-10: manager names + checkboxes
  CONFIG.MANAGERS.forEach(function(manager, i) {
    sheet.getRange(5 + i, 1).setValue(manager.name);
  });
  sheet.getRange('B5:B10').insertCheckboxes();

  // Row 11: blank

  // Row 12: Scoreboard Snapshot section header
  sheet.getRange('A12').setValue('Scoreboard Snapshot').setFontWeight('bold');

  // Rows 13-18: WIG names + score/trend formulas from Dashboard
  CONFIG.MANAGERS.forEach(function(manager, i) {
    const row = 13 + i;
    const dashRow = 2 + i; // Dashboard rows 2-7
    const wigLabel = manager.wig + '. ' + manager.wigName;

    sheet.getRange(row, 1).setValue(wigLabel);
    sheet.getRange(row, 2).setFormula('=Dashboard!C' + dashRow);
    sheet.getRange(row, 3).setFormula('=Dashboard!E' + dashRow);
  });

  // Row 19: blank

  // Row 20: Any Other Business section header
  sheet.getRange('A20').setValue('Any Other Business').setFontWeight('bold');

  // Rows 21-23: merge A21:E23 for freeform notes
  sheet.getRange('A21:E23').merge();

  // Row 24: blank

  // Row 25: Next Chair
  sheet.getRange('A25').setValue('Next Chair').setFontWeight('bold');
  // B25 left empty

  // Column widths: A=250, B=150, C=80, D=200, E=200
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 200);
}


// ---------------------------------------------------------------------------
// Team Tabs
// ---------------------------------------------------------------------------

function buildTeamTab(sheet, manager) {
  // Row 1: WIG full name, merged across A1:D1
  sheet.getRange('A1:D1').merge();
  sheet.getRange('A1')
    .setValue(manager.wigName)
    .setFontWeight('bold')
    .setFontSize(16);

  // Row 2: Manager
  sheet.getRange('A2').setValue('Manager:').setFontWeight('bold');
  sheet.getRange('B2').setValue(manager.name);

  // Row 3: Current Score (key input cell)
  sheet.getRange('A3').setValue('Current Score:').setFontWeight('bold');
  sheet.getRange('B3').setBackground('#fff9c4'); // light yellow highlight

  // Row 4: Last Updated (auto-calculated)
  sheet.getRange('A4').setValue('Last Updated:').setFontWeight('bold');
  sheet.getRange('B4').setFormula('=IF(B3<>"", TODAY(), "")');

  // Row 5: Target
  sheet.getRange('A5').setValue('Target:').setFontWeight('bold');
  sheet.getRange('B5').setValue(manager.target);

  // Row 6: blank

  // Row 7: Milestones section header, merged across A7:D7
  sheet.getRange('A7:D7').merge();
  sheet.getRange('A7')
    .setValue('Milestones')
    .setFontWeight('bold');

  // Row 8: Milestone table headers
  const milestoneHeaders = ['Milestone', 'Status', 'Target Date', 'Notes'];
  const milestoneHeaderRange = sheet.getRange(8, 1, 1, milestoneHeaders.length);
  milestoneHeaderRange.setValues([milestoneHeaders]);
  applyHeaderStyle(milestoneHeaderRange);

  // Rows 9-23: empty milestone rows (15 rows)

  // Column widths: A=250, B=140, C=120, D=300
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 300);

  // Data validation on Status column (B9:B23): dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Not Started', 'In Progress', 'Complete'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('B9:B23').setDataValidation(statusRule);

  // Conditional formatting on Status column (B9:B23)
  const statusRange = sheet.getRange('B9:B23');

  const completeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Complete')
    .setBackground('#c6efce')
    .setFontColor('#006100')
    .setRanges([statusRange])
    .build();

  const inProgressRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('In Progress')
    .setBackground('#fff9c4')
    .setFontColor('#9c6500')
    .setRanges([statusRange])
    .build();

  const notStartedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Not Started')
    .setBackground('#ffc7ce')
    .setFontColor('#9c0006')
    .setRanges([statusRange])
    .build();

  const existingRules = sheet.getConditionalFormatRules();
  sheet.setConditionalFormatRules(
    existingRules.concat([completeRule, inProgressRule, notStartedRule])
  );
}


// ---------------------------------------------------------------------------
// _Config (Hidden)
// ---------------------------------------------------------------------------

function buildConfigTab(sheet) {
  // Row 1: header
  sheet.getRange('A1').setValue('Chair Rotation').setFontWeight('bold');

  // Rows 2-7: manager names
  CONFIG.MANAGERS.forEach(function(manager, i) {
    sheet.getRange(2 + i, 1).setValue(manager.name);
  });

  // B2: initial chair marker
  sheet.getRange('B2').setValue('X');

  // Col D: Previous Scores header + empty slots for snapshot
  sheet.getRange('D1').setValue('Previous Score').setFontWeight('bold');
  sheet.getRange('E1').setValue('Snapshot Date').setFontWeight('bold');

  // Hide the tab
  sheet.hideSheet();
}
