/**
 * Main entry point — called by weekly time trigger (Tuesday 8 AM).
 * Checks who hasn't filled in their Commitment Log entries and sends
 * a targeted Slack reminder.
 */
function sendSmartReminder() {
  const weekEnding = getCurrentWeekEnding();
  let rows = getWeekRows(weekEnding);

  // If no rows exist yet, generate them first
  if (rows.length === 0) {
    generateWeeklyRows();
    rows = getWeekRows(weekEnding);
  }

  // Find managers with empty lag OR lead fields
  const incomplete = rows.filter(function(r) {
    return !r.lagResult || !r.leadCommitment;
  });

  if (incomplete.length === 0) {
    Logger.log('All managers have submitted — no reminder needed.');
    return;
  }

  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const mentions = incomplete.map(function(r) {
    const userId = CONFIG.SLACK_USER_IDS[r.manager];
    return userId ? '<@' + userId + '>' : r.manager;
  });

  const message = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'WIG Meeting Today — Updates Needed' }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'The following managers still need to submit their weekly update:\n\n'
            + mentions.join(', ')
            + '\n\nPlease fill in your *Lag Result* and *Lead Commitment* before the meeting.'
        }
      },
      {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'Open WIG Hub' },
          url: sheetUrl,
          style: 'primary'
        }]
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CONFIG.SLACK_WEBHOOK_URL, options);
  Logger.log('Slack response: ' + response.getResponseCode());
}
