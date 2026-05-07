// ETS WIG Hub — visitor tracker
// POSTs comprehensive pageview, route, click, scroll, and unload events to a
// Google Apps Script endpoint that appends rows to the "Visitors" tab of the
// WIG Manager spreadsheet.

(function () {
  if (window.WIG_ANALYTICS_DISABLED === true) return;
  var ENDPOINT = window.WIG_ANALYTICS_ENDPOINT || '';
  if (!ENDPOINT) { console.info('[wig-analytics] endpoint not configured; tracker idle'); return; }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  var VKEY = 'wigVisitorId', CKEY = 'wigVisitCount', SKEY = 'wigSessionId';
  var visitorId = localStorage.getItem(VKEY);
  var isFirstVisit = !visitorId;
  if (!visitorId) { visitorId = uuid(); localStorage.setItem(VKEY, visitorId); }
  var visitCount = parseInt(localStorage.getItem(CKEY) || '0', 10);
  var sessionId = sessionStorage.getItem(SKEY);
  if (!sessionId) {
    sessionId = uuid();
    sessionStorage.setItem(SKEY, sessionId);
    visitCount += 1;
    localStorage.setItem(CKEY, String(visitCount));
  }

  function parseUA(ua) {
    var b = 'Other', bv = '';
    var pairs = [['Edg/','Edge'],['OPR/','Opera'],['Chrome/','Chrome'],['Firefox/','Firefox'],['Safari/','Safari']];
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i][0]; var idx = ua.indexOf(p);
      if (idx !== -1) {
        if (pairs[i][1] === 'Safari' && ua.indexOf('Chrome/') !== -1) continue;
        b = pairs[i][1]; bv = ua.substring(idx + p.length).split(/\s|;/)[0]; break;
      }
    }
    var os = 'Other';
    if (ua.indexOf('Mac OS X') !== -1) os = 'macOS';
    else if (ua.indexOf('Windows') !== -1) os = 'Windows';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    var device = /Mobi|Android|iPhone/.test(ua) ? 'mobile' : (/iPad|Tablet/.test(ua) ? 'tablet' : 'desktop');
    return { browser: b, browser_version: bv, os: os, device_type: device };
  }

  var pvCount = 0, pageStart = Date.now(), maxScroll = 0, prevHash = '';
  function updateMaxScroll() {
    var doc = document.documentElement;
    var top = window.pageYOffset || doc.scrollTop;
    var h = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (h > 0) { var pct = Math.round((top / h) * 100); if (pct > maxScroll) maxScroll = pct; }
  }
  window.addEventListener('scroll', updateMaxScroll, { passive: true });

  function basePayload() {
    var ua = navigator.userAgent || '';
    var parsed = parseUA(ua);
    var nav = navigator;
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    var nt = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var qs = new URLSearchParams(window.location.search);
    return {
      visitor_id: visitorId, session_id: sessionId, visit_count: visitCount,
      is_first_visit: isFirstVisit, url: window.location.href, path: window.location.pathname,
      hash: window.location.hash || '',
      wig_id: (window.location.hash.match(/wig\/(\d+)/) || [])[1] || '',
      referrer: document.referrer || '', page_title: document.title || '',
      ua: ua, browser: parsed.browser, browser_version: parsed.browser_version,
      os: parsed.os, device_type: parsed.device_type,
      screen_w: screen.width, screen_h: screen.height,
      viewport_w: window.innerWidth, viewport_h: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      lang: nav.language || '', langs: (nav.languages || []).join(','),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      touch: ('ontouchstart' in window) || (nav.maxTouchPoints > 0),
      cpu: nav.hardwareConcurrency || '', mem_gb: nav.deviceMemory || '',
      net_type: conn.effectiveType || '', net_downlink_mbps: conn.downlink || '',
      net_rtt_ms: conn.rtt || '',
      load_ms: nt.loadEventEnd ? Math.round(nt.loadEventEnd - nt.startTime) : '',
      dom_ms: nt.domContentLoadedEventEnd ? Math.round(nt.domContentLoadedEventEnd - nt.startTime) : '',
      ttfb_ms: nt.responseStart ? Math.round(nt.responseStart - nt.startTime) : '',
      session_pv_count: pvCount,
      utm_source: qs.get('utm_source') || '', utm_medium: qs.get('utm_medium') || '',
      utm_campaign: qs.get('utm_campaign') || ''
    };
  }

  function send(payload, useBeacon) {
    try {
      var body = JSON.stringify(payload);
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
      } else {
        fetch(ENDPOINT, {
          method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body
        });
      }
    } catch (e) { /* swallow */ }
  }

  function track(event, extra) {
    if (event === 'pageview' || event === 'route') pvCount += 1;
    var p = basePayload();
    p.event = event; p.prev_hash = prevHash;
    if (extra) for (var k in extra) p[k] = extra[k];
    send(p, false);
  }

  if (document.readyState === 'complete') track('pageview');
  else window.addEventListener('load', function () { setTimeout(function () { track('pageview'); }, 50); });

  window.addEventListener('hashchange', function () {
    var newHash = window.location.hash || '';
    track('route', { hash: newHash });
    prevHash = newHash;
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button, .wig-card, [data-track]');
    if (!el) return;
    var label = el.getAttribute('data-track') || el.id || el.className || el.tagName;
    var text = (el.textContent || '').trim().slice(0, 80);
    track('click', { click_target: String(label).slice(0, 120), click_text: text });
  }, { passive: true });

  function flush() {
    updateMaxScroll();
    var p = basePayload();
    p.event = 'unload';
    p.time_on_page_ms = Date.now() - pageStart;
    p.max_scroll_pct = maxScroll;
    send(p, true);
  }
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);

  setInterval(function () {
    updateMaxScroll();
    track('ping', { time_on_page_ms: Date.now() - pageStart, max_scroll_pct: maxScroll });
  }, 30000);

  console.info('[wig-analytics] tracking active', { visitor: visitorId.slice(0, 8), session: sessionId.slice(0, 8) });
})();
