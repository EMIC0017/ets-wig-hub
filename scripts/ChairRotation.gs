/**
 * Get the next chair from the rotation list stored in the _Config tab.
 * The _Config tab has a "Chair Rotation" section:
 *   Column A: Manager names in rotation order
 *   Column B: "Last Chair" marker (X) on the most recent chair
 */
function rotateChair() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG.TABS.CONFIG);
  if (!configSheet) {
    Logger.log('_Config tab not found — skipping chair rotation');
    return;
  }

  const names = CONFIG.MANAGERS.map(function(m) { return m.name; });
  const rotationRange = configSheet.getRange('A2:B' + (names.length + 1));
  const rotationData = rotationRange.getValues();

  // Find current chair (marked with X)
  let currentIdx = -1;
  for (let i = 0; i < rotationData.length; i++) {
    if (rotationData[i][1] === 'X') {
      currentIdx = i;
      break;
    }
  }

  // Next chair is the one after current (wraps around)
  const nextIdx = (currentIdx + 1) % names.length;

  // Clear all markers, set new one
  for (let i = 0; i < rotationData.length; i++) {
    rotationData[i][1] = (i === nextIdx) ? 'X' : '';
  }
  rotationRange.setValues(rotationData);

  // Update the Meeting tab
  const meetingSheet = ss.getSheetByName(CONFIG.TABS.MEETING);
  if (meetingSheet) {
    meetingSheet.getRange('B2').setValue(names[nextIdx]);
    meetingSheet.getRange('B1').setValue(getCurrentWeekEnding());
  }

  Logger.log('Chair rotated to: ' + names[nextIdx]);
  return names[nextIdx];
}
