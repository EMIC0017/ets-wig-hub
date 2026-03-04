export const SPREADSHEET_ID = import.meta.env.VITE_SHEET_ID || 'YOUR_SPREADSHEET_ID';
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_API_KEY';
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

export const TABS = {
  DASHBOARD: 'Dashboard',
  COMMITMENT_LOG: 'Commitment Log',
  MEETING: 'Meeting',
  CONFIG: '_Config',
};
