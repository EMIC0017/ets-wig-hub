var CONFIG = {
  // Sheet tab names
  TABS: {
    DASHBOARD: 'Dashboard',
    COMMITMENT_LOG: 'Commitment Log',
    MEETING: 'Meeting',
    CONFIG: '_Config',
    TEAMS: [
      'WIG 1 — Jira Mgmt',
      'WIG 2 — CSAT',
      'WIG 3 — Knowledge Mgmt',
      'WIG 4 — Track Work',
      'WIG 5 — Metrics',
      'WIG 6 — Incident Mgmt'
    ]
  },

  // Team data
  MANAGERS: [
    { name: 'Hassan',   wig: 1, wigName: 'Jira Management Process',   target: '100%',      targetType: 'percent' },
    { name: 'Nikita',   wig: 2, wigName: 'CSAT',                      target: '100%',      targetType: 'percent' },
    { name: 'Alicia',   wig: 3, wigName: 'Knowledge Management',      target: '1 Process', targetType: 'text'    },
    { name: 'Eric',     wig: 4, wigName: 'Track Untracked Work',      target: '80%',       targetType: 'percent' },
    { name: 'Sunny',    wig: 5, wigName: 'Sophistication of Metrics', target: '7 KPIs',    targetType: 'text'    },
    { name: 'Jonathan', wig: 6, wigName: 'Incident Management',       target: '100%',      targetType: 'percent' }
  ],

  // Slack config — replace with your actual webhook URL
  SLACK_WEBHOOK_URL: 'PASTE_YOUR_SLACK_WEBHOOK_URL_HERE',

  // Slack user IDs for @mentions (replace with actual IDs)
  SLACK_USER_IDS: {
    'Hassan':   'U_HASSAN_ID',
    'Nikita':   'U_NIKITA_ID',
    'Alicia':   'U_ALICIA_ID',
    'Eric':     'U_ERIC_ID',
    'Sunny':    'U_SUNNY_ID',
    'Jonathan': 'U_JONATHAN_ID'
  },

  // Commitment Log column indices (1-based)
  LOG_COLS: {
    WEEK_ENDING:     1,
    MANAGER:         2,
    WIG:             3,
    LAG_RESULT:      4,
    LEAD_COMMITMENT: 5
  },

  // Team tab layout
  TEAM_SCORE_ROW: 3,
  TEAM_UPDATED_ROW: 4,

  // Meeting day (0=Sun, 1=Mon, 2=Tue)
  MEETING_DAY: 2
};
