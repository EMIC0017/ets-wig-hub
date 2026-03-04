/**
 * Main entry point — called by weekly time trigger (Monday 8 PM).
 * Creates 6 new rows in the Commitment Log for the upcoming meeting week.
 */
function generateWeeklyRows() {
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
