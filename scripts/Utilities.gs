/**
 * Get the Tuesday date for the current week (meeting day).
 * If today is Wed-Mon, returns NEXT Tuesday.
 * If today is Tuesday, returns today.
 */
function getCurrentWeekEnding() {
  const today = new Date();
  const day = today.getDay();
  const meetingDay = CONFIG.MEETING_DAY;
  let diff = meetingDay - day;
  if (diff < 0) diff += 7;
  const tuesday = new Date(today);
  tuesday.setDate(today.getDate() + diff);
  tuesday.setHours(0, 0, 0, 0);
  return tuesday;
}

/**
 * Format a date as "MMM D" (e.g., "Mar 7").
 */
function formatDateShort(date) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[date.getMonth()] + ' ' + date.getDate();
}

/**
 * Format a date as "YYYY-MM-DD" for consistent storage.
 */
function formatDateISO(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Get the Commitment Log sheet. Throws if not found.
 */
function getLogSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.TABS.COMMITMENT_LOG);
  if (!sheet) throw new Error('Commitment Log tab not found');
  return sheet;
}

/**
 * Get rows in the Commitment Log for a specific week ending date.
 * Returns array of {row, manager, wig, lagResult, leadCommitment}.
 */
function getWeekRows(weekEndingDate) {
  const sheet = getLogSheet();
  const data = sheet.getDataRange().getValues();
  const targetDate = formatDateISO(weekEndingDate);
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][CONFIG.LOG_COLS.WEEK_ENDING - 1];
    if (rowDate instanceof Date && formatDateISO(rowDate) === targetDate) {
      results.push({
        row: i + 1,
        manager: data[i][CONFIG.LOG_COLS.MANAGER - 1],
        wig: data[i][CONFIG.LOG_COLS.WIG - 1],
        lagResult: data[i][CONFIG.LOG_COLS.LAG_RESULT - 1],
        leadCommitment: data[i][CONFIG.LOG_COLS.LEAD_COMMITMENT - 1]
      });
    }
  }
  return results;
}
