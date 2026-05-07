// ETS WIG Hub — Visitor Analytics endpoint
// Deploy as a Google Apps Script Web App. See SETUP_ANALYTICS.md.

const HEADERS = [
  'ts_iso','ts_epoch','event','visitor_id','session_id','visit_count','is_first_visit',
  'url','path','hash','wig_id','referrer','ua','browser','browser_version','os','device_type',
  'screen_w','screen_h','viewport_w','viewport_h','dpr','lang','langs','tz','color_scheme',
  'touch','cpu','mem_gb','net_type','net_downlink_mbps','net_rtt_ms','load_ms','dom_ms',
  'ttfb_ms','time_on_page_ms','max_scroll_pct','click_target','click_text','session_pv_count',
  'page_title','prev_hash','utm_source','utm_medium','utm_campaign','extras'
];

function doPost(e) {
  try {
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) throw new Error('SHEET_ID script property not set');
    const ss = SpreadsheetApp.openById(sheetId);
    let sh = ss.getSheetByName('Visitors');
    if (!sh) {
      sh = ss.insertSheet('Visitors');
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight('bold').setBackground('#003D29').setFontColor('#fff');
    }
    const d = JSON.parse(e.postData.contents || '{}');
    const row = HEADERS.map(h => {
      if (h === 'ts_iso') return new Date().toISOString();
      if (h === 'ts_epoch') return Date.now();
      if (h === 'extras') return JSON.stringify(d.extras || {});
      return (d[h] === undefined || d[h] === null) ? '' : d[h];
    });
    sh.appendRow(row);
    return _json({ok: true});
  } catch (err) {
    return _json({ok: false, err: String(err)});
  }
}

function doGet() {
  return _json({ok: true, service: 'wig-hub-analytics', ts: new Date().toISOString()});
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
