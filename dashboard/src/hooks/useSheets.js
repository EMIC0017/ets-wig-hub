import { useState, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { SPREADSHEET_ID, API_KEY, TABS } from '../config/sheets';
import { TEAMS } from '../config/teams';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export function useSheets() {
  const { accessToken } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }), [accessToken]);

  async function readRange(range) {
    const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
    const data = await res.json();
    return data.values || [];
  }

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const rows = await readRange(`${TABS.DASHBOARD}!A2:F7`);
      return rows.map((row, i) => ({
        wig: TEAMS[i],
        score: row[2] || '',
        target: row[3] || '',
        trend: row[4] || '',
        lastUpdated: row[5] || '',
      }));
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchCommitmentLog() {
    setLoading(true);
    setError(null);
    try {
      const rows = await readRange(`${TABS.COMMITMENT_LOG}!A1:E200`);
      if (rows.length <= 1) return [];
      const [, ...dataRows] = rows;
      return dataRows.map((row, i) => ({
        row: i + 2,
        weekEnding: row[0] || '',
        manager: row[1] || '',
        wig: row[2] || '',
        lagResult: row[3] || '',
        leadCommitment: row[4] || '',
      }));
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamTab(tabName) {
    setLoading(true);
    setError(null);
    try {
      const scoreRows = await readRange(`'${tabName}'!A1:B5`);
      const milestoneRows = await readRange(`'${tabName}'!A8:D23`);
      return {
        wigName: scoreRows[0]?.[0] || '',
        manager: scoreRows[1]?.[1] || '',
        score: scoreRows[2]?.[1] || '',
        lastUpdated: scoreRows[3]?.[1] || '',
        target: scoreRows[4]?.[1] || '',
        milestones: (milestoneRows.slice(1) || []).map((row, i) => ({
          row: i + 9,
          name: row[0] || '',
          status: row[1] || '',
          targetDate: row[2] || '',
          notes: row[3] || '',
        })).filter(m => m.name),
      };
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function fetchMeeting() {
    setLoading(true);
    setError(null);
    try {
      const rows = await readRange(`${TABS.MEETING}!A1:E25`);
      return {
        date: rows[0]?.[1] || '',
        chair: rows[1]?.[1] || '',
        attendance: TEAMS.map((t, i) => ({
          manager: t.manager,
          present: rows[4 + i]?.[1] === 'TRUE',
        })),
        aobNotes: rows[20]?.[0] || '',
        nextChair: rows[24]?.[1] || '',
      };
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function writeRange(range, values) {
    const url = `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ values }),
    });
    if (!res.ok) throw new Error(`Sheets write error: ${res.status}`);
    return res.json();
  }

  async function updateCommitment(sheetRow, lagResult, leadCommitment) {
    return writeRange(`${TABS.COMMITMENT_LOG}!D${sheetRow}:E${sheetRow}`, [[lagResult, leadCommitment]]);
  }

  async function updateTeamScore(tabName, score) {
    return writeRange(`'${tabName}'!B3`, [[score]]);
  }

  async function updateMilestoneStatus(tabName, sheetRow, status) {
    return writeRange(`'${tabName}'!B${sheetRow}`, [[status]]);
  }

  async function updateAttendance(managerIndex, present) {
    const row = 5 + managerIndex;
    return writeRange(`${TABS.MEETING}!B${row}`, [[present]]);
  }

  async function updateAOBNotes(notes) {
    return writeRange(`${TABS.MEETING}!A21`, [[notes]]);
  }

  async function updateNextChair(name) {
    return writeRange(`${TABS.MEETING}!B25`, [[name]]);
  }

  return {
    loading, error,
    fetchDashboard, fetchCommitmentLog, fetchTeamTab, fetchMeeting,
    updateCommitment, updateTeamScore, updateMilestoneStatus,
    updateAttendance, updateAOBNotes, updateNextChair,
  };
}
