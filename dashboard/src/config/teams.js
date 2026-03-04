export const TEAMS = [
  { wig: 1, name: 'Jira Management Process', shortName: 'Jira Mgmt',     manager: 'Hassan',   target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#3B82F6', tabName: 'WIG 1 — Jira Mgmt' },
  { wig: 2, name: 'CSAT',                    shortName: 'CSAT',           manager: 'Nikita',   target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#10B981', tabName: 'WIG 2 — CSAT' },
  { wig: 3, name: 'Knowledge Management',    shortName: 'Knowledge Mgmt', manager: 'Alicia',   target: '1 Process', targetValue: 1,  targetType: 'text',    color: '#8B5CF6', tabName: 'WIG 3 — Knowledge Mgmt' },
  { wig: 4, name: 'Track Untracked Work',    shortName: 'Track Work',     manager: 'Eric',     target: '80%',     targetValue: 0.8,  targetType: 'percent', color: '#F59E0B', tabName: 'WIG 4 — Track Work' },
  { wig: 5, name: 'Sophistication of Metrics', shortName: 'Metrics',      manager: 'Sunny',    target: '7 KPIs',  targetValue: 7,    targetType: 'text',    color: '#F43F5E', tabName: 'WIG 5 — Metrics' },
  { wig: 6, name: 'Incident Management',     shortName: 'Incident Mgmt',  manager: 'Jonathan', target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#06B6D4', tabName: 'WIG 6 — Incident Mgmt' },
];

export const MANAGERS = TEAMS.map(t => t.manager);
