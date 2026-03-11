/**
 * Snapshots current WIG scores to _Config D column so Dashboard trend
 * formulas can compare this week vs last week. Called automatically
 * before new weekly rows are created.
 */
function snapshotScores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName(CONFIG.TABS.CONFIG);
  var today = new Date();

  CONFIG.MANAGERS.forEach(function(manager, i) {
    var tabName = CONFIG.TABS.TEAMS[i];
    var teamSheet = ss.getSheetByName(tabName);
    if (!teamSheet) return;

    var currentScore = teamSheet.getRange('B3').getValue();
    var row = 2 + i; // _Config rows 2-7

    // Save current score as "previous" before the new week resets
    configSheet.getRange(row, 4).setValue(currentScore); // Col D = Previous Score
    configSheet.getRange(row, 5).setValue(today);         // Col E = Snapshot Date
  });

  Logger.log('Snapshotted scores to _Config at ' + today);
}


/**
 * Main entry point — called by weekly time trigger (Monday 8 PM).
 * Creates 6 new rows in the Commitment Log for the upcoming meeting week.
 */
function generateWeeklyRows() {
  // Snapshot current scores before creating new week rows
  snapshotScores();

  const sheet = getLogSheet();
  const weekEnding = getCurrentWeekEnding();

  // Check if rows already exist for this week (idempotent)
  const existing = getWeekRows(weekEnding);
  if (existing.length > 0) {
    Logger.log('Rows already exist for week ending ' + formatDateISO(weekEnding));
    return;
  }

  // Add a blank separator row if the sheet has data beyond the header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.insertRowAfter(lastRow);
  }

  // Append one row per manager
  const rows = CONFIG.MANAGERS.map(function(mgr) {
    return [weekEnding, mgr.name, mgr.wig + '. ' + mgr.wigName, '', ''];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 5).setValues(rows);

  // Format the date column
  sheet.getRange(startRow, 1, rows.length, 1).setNumberFormat('MMM d, yyyy');

  Logger.log('Created ' + rows.length + ' rows for week ending ' + formatDateISO(weekEnding));
}
