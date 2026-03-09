/**
 * WebApp.gs — REST API layer for the ETS WIG Hub Superblocks dashboard.
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web app
 *   - Execute as: Me
 *   - Who has access: Anyone with the link
 *
 * All reads use GET with ?action=<name>&<params>
 * All writes use POST with JSON body { action: "<name>", ... }
 */

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doGet(e) {
  try {
    var action = (e.parameter.action || '').toLowerCase();
    var result;

    switch (action) {
      case 'dashboard':
        result = getDashboard_();
        break;
      case 'commitments':
        result = getCommitments_(e.parameter);
        break;
      case 'meeting':
        result = getMeeting_();
        break;
      case 'team':
        result = getTeam_(e.parameter);
        break;
      default:
        result = { error: 'Unknown action: ' + action, actions: ['dashboard', 'commitments', 'meeting', 'team'] };
    }

    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = (body.action || '').toLowerCase();
    var result;

    switch (action) {
      case 'update_score':
        result = updateScore_(body);
        break;
      case 'update_commitment':
        result = updateCommitment_(body);
        break;
      case 'update_attendance':
        result = updateAttendance_(body);
        break;
      case 'update_aob':
        result = updateAob_(body);
        break;
      default:
        result = { error: 'Unknown action: ' + action, actions: ['update_score', 'update_commitment', 'update_attendance', 'update_aob'] };
    }

    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// READ handlers
// ---------------------------------------------------------------------------

/**
 * Returns all 6 WIG rows from the Dashboard tab.
 * Response: { wigs: [ { wig, manager, score, target, trend, lastUpdated }, ... ] }
 */
function getDashboard_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.DASHBOARD);
  var data = sheet.getRange('A2:F7').getValues();
  var wigs = [];

  for (var i = 0; i < data.length; i++) {
    wigs.push({
      wigNumber: i + 1,
      wig: data[i][0],           // Column A — WIG name (hyperlink text)
      manager: data[i][1],       // Column B
      score: data[i][2],         // Column C — could be number or string
      target: data[i][3],        // Column D
      trend: data[i][4],         // Column E — arrow symbol
      lastUpdated: formatDate_(data[i][5])  // Column F
    });
  }

  return { wigs: wigs };
}

/**
 * Returns commitment log entries.
 * Params:
 *   weeks (optional) — number of recent weeks to return, default 1
 * Response: { commitments: [ { weekEnding, manager, wig, lagResult, leadCommitment }, ... ] }
 */
function getCommitments_(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.COMMITMENT_LOG);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { commitments: [] };

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var weeksToReturn = parseInt(params.weeks) || 1;

  // Collect unique week-ending dates (sorted descending)
  var dateSet = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] instanceof Date) {
      dateSet[data[i][0].getTime()] = true;
    }
  }
  var uniqueDates = Object.keys(dateSet).map(Number).sort(function(a, b) { return b - a; });
  var cutoffDates = uniqueDates.slice(0, weeksToReturn);

  var commitments = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] instanceof Date && cutoffDates.indexOf(data[i][0].getTime()) !== -1) {
      commitments.push({
        weekEnding: formatDate_(data[i][0]),
        manager: data[i][1],
        wig: data[i][2],
        lagResult: data[i][3],
        leadCommitment: data[i][4]
      });
    }
  }

  return { commitments: commitments };
}

/**
 * Returns meeting tab data: date, chair, attendance, scoreboard, AOB.
 */
function getMeeting_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.MEETING);

  var meetingDate = sheet.getRange('B1').getValue();
  var chair = sheet.getRange('B2').getValue();

  // Attendance: A5:B10 — name in A, checkbox in B
  var attendanceData = sheet.getRange('A5:B10').getValues();
  var attendance = [];
  for (var i = 0; i < attendanceData.length; i++) {
    attendance.push({
      manager: attendanceData[i][0],
      present: attendanceData[i][1] === true
    });
  }

  // Scoreboard: A13:C18 — WIG name, score, trend
  var scoreData = sheet.getRange('A13:C18').getValues();
  var scoreboard = [];
  for (var i = 0; i < scoreData.length; i++) {
    scoreboard.push({
      wig: scoreData[i][0],
      score: scoreData[i][1],
      trend: scoreData[i][2]
    });
  }

  // AOB: merged cell A21:E23
  var aob = sheet.getRange('A21').getValue();

  // Next chair: B25
  var nextChair = sheet.getRange('B25').getValue();

  return {
    meetingDate: formatDate_(meetingDate),
    chair: chair,
    attendance: attendance,
    scoreboard: scoreboard,
    aob: aob,
    nextChair: nextChair
  };
}

/**
 * Returns team tab data: score, milestones.
 * Params:
 *   wig (required) — WIG number 1-6
 * Response: { manager, score, lastUpdated, target, milestones: [...] }
 */
function getTeam_(params) {
  var wigNum = parseInt(params.wig);
  if (!wigNum || wigNum < 1 || wigNum > 6) {
    return { error: 'wig parameter must be 1-6' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = CONFIG.TABS.TEAMS[wigNum - 1];
  var sheet = ss.getSheetByName(tabName);

  var manager = sheet.getRange('B2').getValue();
  var score = sheet.getRange('B3').getValue();
  var lastUpdated = sheet.getRange('B4').getValue();
  var target = sheet.getRange('B5').getValue();

  // Milestones: row 9 onward, columns A-D
  var lastRow = sheet.getLastRow();
  var milestones = [];
  if (lastRow >= 9) {
    var milestoneData = sheet.getRange(9, 1, lastRow - 8, 4).getValues();
    for (var i = 0; i < milestoneData.length; i++) {
      if (milestoneData[i][0] === '' && milestoneData[i][1] === '') continue; // skip empty rows
      milestones.push({
        row: i + 9,
        milestone: milestoneData[i][0],
        status: milestoneData[i][1],
        targetDate: formatDate_(milestoneData[i][2]),
        notes: milestoneData[i][3]
      });
    }
  }

  return {
    wigNumber: wigNum,
    tabName: tabName,
    manager: manager,
    score: score,
    lastUpdated: formatDate_(lastUpdated),
    target: target,
    milestones: milestones
  };
}

// ---------------------------------------------------------------------------
// WRITE handlers
// ---------------------------------------------------------------------------

/**
 * Update a team's current score.
 * Body: { action: "update_score", wig: 1-6, score: "75%" }
 */
function updateScore_(body) {
  var wigNum = parseInt(body.wig);
  if (!wigNum || wigNum < 1 || wigNum > 6) {
    return { error: 'wig must be 1-6' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = CONFIG.TABS.TEAMS[wigNum - 1];
  var sheet = ss.getSheetByName(tabName);
  sheet.getRange('B3').setValue(body.score);

  return { success: true, wig: wigNum, score: body.score };
}

/**
 * Update a commitment log entry (lag result and/or lead commitment).
 * Body: { action: "update_commitment", manager: "Hassan", lagResult: "...", leadCommitment: "..." }
 * Finds the current week's row for that manager and writes columns D and/or E.
 */
function updateCommitment_(body) {
  var manager = body.manager;
  if (!manager) return { error: 'manager is required' };

  var weekEnding = getCurrentWeekEnding();
  var rows = getWeekRows(weekEnding);
  var targetRow = null;

  for (var i = 0; i < rows.length; i++) {
    if (rows[i].manager === manager) {
      targetRow = rows[i].row;
      break;
    }
  }

  if (!targetRow) {
    return { error: 'No commitment log row found for ' + manager + ' this week' };
  }

  var sheet = getLogSheet();
  if (body.lagResult !== undefined) {
    sheet.getRange(targetRow, CONFIG.LOG_COLS.LAG_RESULT).setValue(body.lagResult);
  }
  if (body.leadCommitment !== undefined) {
    sheet.getRange(targetRow, CONFIG.LOG_COLS.LEAD_COMMITMENT).setValue(body.leadCommitment);
  }

  return { success: true, manager: manager, row: targetRow };
}

/**
 * Update meeting attendance.
 * Body: { action: "update_attendance", attendance: { "Hassan": true, "Nikita": false, ... } }
 */
function updateAttendance_(body) {
  var att = body.attendance;
  if (!att) return { error: 'attendance object is required' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.MEETING);

  // A5:B10 — match manager name in A column, write checkbox to B column
  var names = sheet.getRange('A5:A10').getValues();
  for (var i = 0; i < names.length; i++) {
    var name = names[i][0];
    if (att.hasOwnProperty(name)) {
      sheet.getRange(5 + i, 2).setValue(att[name] === true);
    }
  }

  return { success: true };
}

/**
 * Update AOB notes.
 * Body: { action: "update_aob", aob: "Notes text here..." }
 */
function updateAob_(body) {
  if (body.aob === undefined) return { error: 'aob field is required' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.MEETING);
  sheet.getRange('A21').setValue(body.aob);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate_(value) {
  if (value instanceof Date) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[value.getMonth()] + ' ' + value.getDate() + ', ' + value.getFullYear();
  }
  return value || '';
}
