# ETS WIG Hub Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React dashboard that visualizes ETS WIG progress with concentric rings, reads/writes to Google Sheets via OAuth, and provides interactive views for weekly accountability meetings.

**Architecture:** A Vite + React 18 SPA with three-panel Linear-like layout. Google Identity Services handles OAuth in-browser. A custom `useSheets` hook wraps all Sheets API v4 calls. Custom SVG rings render team progress. React Router handles Dashboard, WIG Detail, and Meeting views.

**Tech Stack:** React 18, Vite, Tailwind CSS 4, React Router 7, Google Identity Services, Google Sheets API v4

---

## Task 1: Scaffold Vite + React + Tailwind Project

**Files:**
- Create: `dashboard/` (new directory within ets-wig-hub)
- Create: `dashboard/package.json`
- Create: `dashboard/vite.config.js`
- Create: `dashboard/index.html`
- Create: `dashboard/src/main.jsx`
- Create: `dashboard/src/App.jsx`

**Step 1: Scaffold with Vite**

```bash
cd ~/projects/ets-wig-hub
npm create vite@latest dashboard -- --template react
```

**Step 2: Install dependencies**

```bash
cd ~/projects/ets-wig-hub/dashboard
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install react-router-dom
```

**Step 3: Configure Tailwind with Vite plugin**

Replace `dashboard/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace `dashboard/src/index.css`:

```css
@import 'tailwindcss';
```

**Step 4: Clean up scaffolding**

Remove default Vite boilerplate from `App.jsx`. Replace with:

```jsx
export default function App() {
  return <div className="min-h-screen bg-gray-950 text-gray-100">WIG Hub</div>;
}
```

**Step 5: Verify it runs**

```bash
cd ~/projects/ets-wig-hub/dashboard
npm run dev
```

Expected: Vite dev server starts, browser shows dark page with "WIG Hub" text.

**Step 6: Commit**

```bash
cd ~/projects/ets-wig-hub
git add dashboard/
git commit -m "chore: scaffold React + Vite + Tailwind dashboard"
```

---

## Task 2: Team Config and Color Constants

**Files:**
- Create: `dashboard/src/config/teams.js`
- Create: `dashboard/src/config/sheets.js`

**Step 1: Create team config**

`dashboard/src/config/teams.js` — mirrors Config.gs data:

```js
export const TEAMS = [
  { wig: 1, name: 'Jira Management Process', shortName: 'Jira Mgmt',     manager: 'Hassan',   target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#3B82F6', tabName: 'WIG 1 — Jira Mgmt' },
  { wig: 2, name: 'CSAT',                    shortName: 'CSAT',           manager: 'Nikita',   target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#10B981', tabName: 'WIG 2 — CSAT' },
  { wig: 3, name: 'Knowledge Management',    shortName: 'Knowledge Mgmt', manager: 'Alicia',   target: '1 Process', targetValue: 1,  targetType: 'text',    color: '#8B5CF6', tabName: 'WIG 3 — Knowledge Mgmt' },
  { wig: 4, name: 'Track Untracked Work',    shortName: 'Track Work',     manager: 'Eric',     target: '80%',     targetValue: 0.8,  targetType: 'percent', color: '#F59E0B', tabName: 'WIG 4 — Track Work' },
  { wig: 5, name: 'Sophistication of Metrics', shortName: 'Metrics',      manager: 'Sunny',    target: '7 KPIs',  targetValue: 7,    targetType: 'text',    color: '#F43F5E', tabName: 'WIG 5 — Metrics' },
  { wig: 6, name: 'Incident Management',     shortName: 'Incident Mgmt',  manager: 'Jonathan', target: '100%',    targetValue: 1.0,  targetType: 'percent', color: '#06B6D4', tabName: 'WIG 6 — Incident Mgmt' },
];

export const MANAGERS = TEAMS.map(t => t.manager);
```

**Step 2: Create sheets config**

`dashboard/src/config/sheets.js`:

```js
// Google Sheets API configuration
// Replace SPREADSHEET_ID with your actual sheet ID from the URL:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
export const SPREADSHEET_ID = import.meta.env.VITE_SHEET_ID || 'YOUR_SPREADSHEET_ID';

// Google OAuth Client ID from Google Cloud Console
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';

export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_API_KEY';

export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Sheet tab names (must match Config.gs)
export const TABS = {
  DASHBOARD: 'Dashboard',
  COMMITMENT_LOG: 'Commitment Log',
  MEETING: 'Meeting',
  CONFIG: '_Config',
};
```

**Step 3: Create .env.example**

`dashboard/.env.example`:

```
VITE_SHEET_ID=your_spreadsheet_id_here
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

**Step 4: Add .env to .gitignore**

Append to `dashboard/.gitignore`:

```
.env
.env.local
```

**Step 5: Commit**

```bash
git add dashboard/src/config/ dashboard/.env.example dashboard/.gitignore
git commit -m "feat: add team config and Google Sheets constants"
```

---

## Task 3: Google Auth Hook

**Files:**
- Create: `dashboard/src/hooks/useAuth.js`
- Create: `dashboard/src/components/AuthGate.jsx`

**Step 1: Create useAuth hook**

`dashboard/src/hooks/useAuth.js`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import { CLIENT_ID, SCOPES } from '../config/sheets';

let tokenClient = null;

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsSignedIn(true);
            // Fetch user info
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
              .then(r => r.json())
              .then(info => setUser({ name: info.name, email: info.email, picture: info.picture }));
          }
        },
      });
      setLoading(false);
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken);
    }
    setAccessToken(null);
    setIsSignedIn(false);
    setUser(null);
  }, [accessToken]);

  return { isSignedIn, user, accessToken, loading, signIn, signOut };
}
```

**Step 2: Create AuthGate wrapper**

`dashboard/src/components/AuthGate.jsx`:

```jsx
import { useAuth } from '../hooks/useAuth';

export default function AuthGate({ children }) {
  const { isSignedIn, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-100 mb-2">ETS WIG Hub</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in with your Google account to access the dashboard.</p>
          <button
            onClick={signIn}
            className="px-5 py-2.5 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return children;
}
```

**Step 3: Wire AuthGate into App.jsx**

```jsx
import AuthGate from './components/AuthGate';

export default function App() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        Authenticated — WIG Hub
      </div>
    </AuthGate>
  );
}
```

**Step 4: Verify** — `npm run dev`, should see sign-in page.

**Step 5: Commit**

```bash
git add dashboard/src/hooks/useAuth.js dashboard/src/components/AuthGate.jsx dashboard/src/App.jsx
git commit -m "feat: add Google OAuth authentication flow"
```

---

## Task 4: Google Sheets API Data Hook

**Files:**
- Create: `dashboard/src/hooks/useSheets.js`
- Create: `dashboard/src/context/AuthContext.jsx`

**Step 1: Create AuthContext to share auth state**

`dashboard/src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
```

**Step 2: Create useSheets hook**

`dashboard/src/hooks/useSheets.js`:

```jsx
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

  // --- READ OPERATIONS ---

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
        trend: row[4] || '→',
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
      const [, ...dataRows] = rows; // skip header
      return dataRows.map((row, i) => ({
        row: i + 2, // 1-based, skip header
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

  // --- WRITE OPERATIONS ---

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
    return writeRange(
      `${TABS.COMMITMENT_LOG}!D${sheetRow}:E${sheetRow}`,
      [[lagResult, leadCommitment]]
    );
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
    loading,
    error,
    fetchDashboard,
    fetchCommitmentLog,
    fetchTeamTab,
    fetchMeeting,
    updateCommitment,
    updateTeamScore,
    updateMilestoneStatus,
    updateAttendance,
    updateAOBNotes,
    updateNextChair,
  };
}
```

**Step 3: Update App.jsx to use AuthProvider**

```jsx
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="min-h-screen bg-gray-950 text-gray-100">
          Authenticated — WIG Hub
        </div>
      </AuthGate>
    </AuthProvider>
  );
}
```

**Step 4: Commit**

```bash
git add dashboard/src/hooks/useSheets.js dashboard/src/context/AuthContext.jsx dashboard/src/App.jsx
git commit -m "feat: add Google Sheets API read/write hook and auth context"
```

---

## Task 5: Three-Panel Layout

**Files:**
- Create: `dashboard/src/components/layout/Sidebar.jsx`
- Create: `dashboard/src/components/layout/Layout.jsx`

**Step 1: Create Sidebar**

`dashboard/src/components/layout/Sidebar.jsx`:

```jsx
import { NavLink } from 'react-router-dom';
import { TEAMS } from '../../config/teams';

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `block px-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-gray-800 text-gray-100'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
    }`;

  return (
    <aside className="w-56 border-r border-gray-800 p-4 flex flex-col gap-6">
      <NavLink to="/" className="text-base font-semibold text-gray-100 px-3">
        ETS WIG Hub
      </NavLink>

      <nav className="flex flex-col gap-0.5">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        <div className="mt-4 mb-1 px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          WIG Teams
        </div>
        {TEAMS.map(team => (
          <NavLink key={team.wig} to={`/wig/${team.wig}`} className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: team.color }} />
            {team.shortName}
          </NavLink>
        ))}
        <div className="mt-4 mb-1 px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Process
        </div>
        <NavLink to="/meeting" className={linkClass}>Meeting</NavLink>
      </nav>
    </aside>
  );
}
```

**Step 2: Create Layout wrapper**

`dashboard/src/components/layout/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthContext } from '../../context/AuthContext';

export default function Layout() {
  const { user, signOut } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-12 border-b border-gray-800 flex items-center justify-end px-4 gap-3">
          {user && (
            <>
              <span className="text-sm text-gray-400">{user.name}</span>
              {user.picture && (
                <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
              )}
            </>
          )}
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Step 3: Set up React Router in App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import Layout from './components/layout/Layout';

function DashboardPage() {
  return <div className="p-6">Dashboard — coming next</div>;
}

function WigDetailPage() {
  return <div className="p-6">WIG Detail — coming soon</div>;
}

function MeetingPage() {
  return <div className="p-6">Meeting — coming soon</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="wig/:wigId" element={<WigDetailPage />} />
              <Route path="meeting" element={<MeetingPage />} />
            </Route>
          </Routes>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Verify** — `npm run dev`, navigation between routes works, sidebar highlights active item.

**Step 5: Commit**

```bash
git add dashboard/src/components/layout/ dashboard/src/App.jsx
git commit -m "feat: add three-panel layout with sidebar navigation and routing"
```

---

## Task 6: Concentric Rings Visualization

**Files:**
- Create: `dashboard/src/components/rings/RingArc.jsx`
- Create: `dashboard/src/components/rings/ConcentricRings.jsx`
- Create: `dashboard/src/components/rings/RingTooltip.jsx`

**Step 1: Create RingArc (single SVG arc)**

`dashboard/src/components/rings/RingArc.jsx`:

```jsx
function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export default function RingArc({ cx, cy, radius, percent, color, strokeWidth, onMouseEnter, onMouseLeave, onClick }) {
  const clampedPercent = Math.min(Math.max(percent, 0), 1);
  const angle = clampedPercent * 359.99; // avoid full-circle edge case

  return (
    <g className="cursor-pointer" onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Background ring (faded) */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.15}
      />
      {/* Filled arc */}
      {clampedPercent > 0 && (
        <path
          d={describeArc(cx, cy, radius, 0, angle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}
```

**Step 2: Create RingTooltip**

`dashboard/src/components/rings/RingTooltip.jsx`:

```jsx
export default function RingTooltip({ team, score, x, y, visible }) {
  if (!visible || !team) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-lg"
      style={{ left: x + 12, top: y - 20 }}
    >
      <div className="font-medium" style={{ color: team.color }}>{team.name}</div>
      <div className="text-gray-400 text-xs">{team.manager} — {score} / {team.target}</div>
    </div>
  );
}
```

**Step 3: Create ConcentricRings**

`dashboard/src/components/rings/ConcentricRings.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RingArc from './RingArc';
import RingTooltip from './RingTooltip';

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 18;
const GAP = 6;
const OUTER_RADIUS = 140;

export default function ConcentricRings({ dashboardData }) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState({ visible: false, team: null, score: '', x: 0, y: 0 });

  // Count how many are "on track" (>= 50% for percentage types)
  const onTrack = dashboardData.filter(d => {
    if (d.wig.targetType === 'percent') {
      const val = parseFloat(d.score) || 0;
      return val >= 0.5;
    }
    return d.score && d.score !== '';
  }).length;

  return (
    <div className="relative inline-block">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {dashboardData.map((d, i) => {
          const radius = OUTER_RADIUS - i * (STROKE + GAP);
          let percent = 0;
          if (d.wig.targetType === 'percent') {
            percent = parseFloat(d.score) || 0;
          } else {
            // For text targets, treat any non-empty value as some progress
            percent = d.score ? 0.5 : 0;
          }

          return (
            <RingArc
              key={d.wig.wig}
              cx={CX}
              cy={CY}
              radius={radius}
              percent={percent}
              color={d.wig.color}
              strokeWidth={STROKE}
              onClick={() => navigate(`/wig/${d.wig.wig}`)}
              onMouseEnter={(e) =>
                setTooltip({ visible: true, team: d.wig, score: d.score, x: e.clientX, y: e.clientY })
              }
              onMouseLeave={() => setTooltip({ visible: false, team: null, score: '', x: 0, y: 0 })}
            />
          );
        })}
        {/* Center label */}
        <text x={CX} y={CY - 6} textAnchor="middle" className="fill-gray-100 text-2xl font-bold">
          {onTrack}/6
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" className="fill-gray-500 text-xs">
          on track
        </text>
      </svg>
      <RingTooltip {...tooltip} />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add dashboard/src/components/rings/
git commit -m "feat: add concentric rings SVG visualization"
```

---

## Task 7: Dashboard Page — Table + Rings + Right Panel

**Files:**
- Create: `dashboard/src/components/dashboard/DashboardTable.jsx`
- Create: `dashboard/src/components/dashboard/CommitmentStatus.jsx`
- Create: `dashboard/src/pages/DashboardPage.jsx`

**Step 1: Create DashboardTable**

`dashboard/src/components/dashboard/DashboardTable.jsx`:

```jsx
import { useNavigate } from 'react-router-dom';

export default function DashboardTable({ dashboardData }) {
  const navigate = useNavigate();

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
          <th className="text-left py-2 px-3 font-medium">WIG</th>
          <th className="text-left py-2 px-3 font-medium">Manager</th>
          <th className="text-left py-2 px-3 font-medium">Score</th>
          <th className="text-left py-2 px-3 font-medium">Target</th>
          <th className="text-center py-2 px-3 font-medium">Trend</th>
          <th className="text-left py-2 px-3 font-medium">Updated</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.map(d => (
          <tr
            key={d.wig.wig}
            onClick={() => navigate(`/wig/${d.wig.wig}`)}
            className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
          >
            <td className="py-2.5 px-3">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: d.wig.color }} />
              {d.wig.shortName}
            </td>
            <td className="py-2.5 px-3 text-gray-400">{d.wig.manager}</td>
            <td className="py-2.5 px-3 font-medium">{d.score || '—'}</td>
            <td className="py-2.5 px-3 text-gray-400">{d.target}</td>
            <td className="py-2.5 px-3 text-center text-lg">{d.trend}</td>
            <td className="py-2.5 px-3 text-gray-500 text-xs">{d.lastUpdated || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 2: Create CommitmentStatus (right panel)**

`dashboard/src/components/dashboard/CommitmentStatus.jsx`:

```jsx
import { TEAMS } from '../../config/teams';

export default function CommitmentStatus({ commitments }) {
  // Get the most recent week's entries
  const currentWeek = getCurrentWeekEntries(commitments);

  return (
    <div className="w-64 border-l border-gray-800 p-4">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Commitment Status
      </h3>
      <div className="text-[11px] text-gray-600 flex mb-2">
        <span className="flex-1" />
        <span className="w-12 text-center">Lag</span>
        <span className="w-12 text-center">Lead</span>
      </div>
      {TEAMS.map(team => {
        const entry = currentWeek.find(c => c.manager === team.manager);
        const hasLag = entry && entry.lagResult.trim() !== '';
        const hasLead = entry && entry.leadCommitment.trim() !== '';

        return (
          <div key={team.wig} className="flex items-center py-1.5 border-b border-gray-800/30">
            <span className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: team.color }} />
            <span className="text-sm text-gray-300 flex-1 truncate">{team.shortName}</span>
            <span className="w-12 text-center">{hasLag ? '✅' : '❌'}</span>
            <span className="w-12 text-center">{hasLead ? '✅' : '❌'}</span>
          </div>
        );
      })}
      <div className="mt-3 text-[11px] text-gray-600">
        ✅ = submitted &nbsp; ❌ = missing
      </div>
    </div>
  );
}

function getCurrentWeekEntries(commitments) {
  if (!commitments.length) return [];
  // Find the most recent week ending date
  const latestWeek = commitments[commitments.length - 1]?.weekEnding;
  if (!latestWeek) return [];
  return commitments.filter(c => c.weekEnding === latestWeek);
}
```

**Step 3: Create DashboardPage**

`dashboard/src/pages/DashboardPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useSheets } from '../hooks/useSheets';
import ConcentricRings from '../components/rings/ConcentricRings';
import DashboardTable from '../components/dashboard/DashboardTable';
import CommitmentStatus from '../components/dashboard/CommitmentStatus';

export default function DashboardPage() {
  const { fetchDashboard, fetchCommitmentLog, loading, error } = useSheets();
  const [dashboardData, setDashboardData] = useState([]);
  const [commitments, setCommitments] = useState([]);

  useEffect(() => {
    async function load() {
      const [dash, log] = await Promise.all([fetchDashboard(), fetchCommitmentLog()]);
      setDashboardData(dash);
      setCommitments(log);
    }
    load();
  }, []);

  if (loading && !dashboardData.length) {
    return <div className="p-6 text-gray-500 text-sm">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400 text-sm">Error: {error}</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        <div className="flex justify-center mb-8">
          <ConcentricRings dashboardData={dashboardData} />
        </div>
        <DashboardTable dashboardData={dashboardData} />
      </div>
      <CommitmentStatus commitments={commitments} />
    </div>
  );
}
```

**Step 4: Update App.jsx to use DashboardPage**

Replace the placeholder `DashboardPage` function with the import:

```jsx
import DashboardPage from './pages/DashboardPage';
```

And use `<Route index element={<DashboardPage />} />` in the routes.

**Step 5: Verify** — `npm run dev`, Dashboard view shows rings + table + right panel.

**Step 6: Commit**

```bash
git add dashboard/src/components/dashboard/ dashboard/src/pages/DashboardPage.jsx dashboard/src/App.jsx
git commit -m "feat: add dashboard page with rings, table, and commitment status"
```

---

## Task 8: WIG Detail Page (Read + Write)

**Files:**
- Create: `dashboard/src/pages/WigDetailPage.jsx`
- Create: `dashboard/src/components/detail/ScoreEditor.jsx`
- Create: `dashboard/src/components/detail/MilestoneTable.jsx`
- Create: `dashboard/src/components/detail/CommitmentForm.jsx`
- Create: `dashboard/src/components/detail/CommitmentHistory.jsx`

**Step 1: Create ScoreEditor (inline edit, writes to B3)**

`dashboard/src/components/detail/ScoreEditor.jsx`:

```jsx
import { useState } from 'react';

export default function ScoreEditor({ score, target, color, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(score);

  function handleSave() {
    onSave(value);
    setEditing(false);
  }

  return (
    <div className="flex items-baseline gap-4">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-lg font-bold w-28 focus:outline-none focus:border-gray-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="text-sm text-emerald-400 hover:text-emerald-300">Save</button>
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-400">Cancel</button>
        </div>
      ) : (
        <span
          className="text-3xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color }}
          onClick={() => { setValue(score); setEditing(true); }}
          title="Click to edit"
        >
          {score || '—'}
        </span>
      )}
      <span className="text-gray-500">/ {target}</span>
    </div>
  );
}
```

**Step 2: Create MilestoneTable (status dropdown writes to team tab)**

`dashboard/src/components/detail/MilestoneTable.jsx`:

```jsx
const STATUSES = ['Not Started', 'In Progress', 'Complete'];
const STATUS_COLORS = {
  'Not Started': 'text-red-400',
  'In Progress': 'text-amber-400',
  'Complete': 'text-emerald-400',
};

export default function MilestoneTable({ milestones, onStatusChange }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Milestones</h3>
      {milestones.length === 0 ? (
        <p className="text-sm text-gray-600">No milestones defined.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 px-2 font-medium">Milestone</th>
              <th className="text-left py-2 px-2 font-medium">Status</th>
              <th className="text-left py-2 px-2 font-medium">Target Date</th>
              <th className="text-left py-2 px-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(m => (
              <tr key={m.row} className="border-b border-gray-800/30">
                <td className="py-2 px-2 text-gray-300">{m.name}</td>
                <td className="py-2 px-2">
                  <select
                    value={m.status}
                    onChange={e => onStatusChange(m.row, e.target.value)}
                    className={`bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none ${STATUS_COLORS[m.status] || 'text-gray-400'}`}
                  >
                    <option value="">—</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2 text-gray-500">{m.targetDate}</td>
                <td className="py-2 px-2 text-gray-500">{m.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Step 3: Create CommitmentForm (writes lag/lead to Commitment Log)**

`dashboard/src/components/detail/CommitmentForm.jsx`:

```jsx
import { useState } from 'react';

export default function CommitmentForm({ currentEntry, onSave }) {
  const [lag, setLag] = useState(currentEntry?.lagResult || '');
  const [lead, setLead] = useState(currentEntry?.leadCommitment || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(lag, lead);
    setSaving(false);
  }

  if (!currentEntry) {
    return <p className="text-sm text-gray-600">No commitment log entry for this week yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        This Week's Commitment ({currentEntry.weekEnding})
      </h3>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Lag Result (last week)</label>
        <textarea
          value={lag}
          onChange={e => setLag(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Lead Commitment (this week)</label>
        <textarea
          value={lead}
          onChange={e => setLead(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Commitment'}
      </button>
    </div>
  );
}
```

**Step 4: Create CommitmentHistory**

`dashboard/src/components/detail/CommitmentHistory.jsx`:

```jsx
export default function CommitmentHistory({ entries }) {
  if (!entries.length) {
    return <p className="text-sm text-gray-600">No history yet.</p>;
  }

  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent History</h3>
      <div className="space-y-3">
        {entries.slice(-4).reverse().map((e, i) => (
          <div key={i} className="border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{e.weekEnding}</div>
            {e.lagResult && (
              <div className="text-sm text-gray-300 mb-1">
                <span className="text-gray-500">Lag:</span> {e.lagResult}
              </div>
            )}
            {e.leadCommitment && (
              <div className="text-sm text-gray-300">
                <span className="text-gray-500">Lead:</span> {e.leadCommitment}
              </div>
            )}
            {!e.lagResult && !e.leadCommitment && (
              <div className="text-sm text-gray-600 italic">No entries</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Create WigDetailPage**

`dashboard/src/pages/WigDetailPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TEAMS } from '../config/teams';
import { useSheets } from '../hooks/useSheets';
import ScoreEditor from '../components/detail/ScoreEditor';
import MilestoneTable from '../components/detail/MilestoneTable';
import CommitmentForm from '../components/detail/CommitmentForm';
import CommitmentHistory from '../components/detail/CommitmentHistory';

export default function WigDetailPage() {
  const { wigId } = useParams();
  const team = TEAMS.find(t => t.wig === parseInt(wigId, 10));
  const { fetchTeamTab, fetchCommitmentLog, updateTeamScore, updateMilestoneStatus, updateCommitment, loading } = useSheets();

  const [teamData, setTeamData] = useState(null);
  const [commitments, setCommitments] = useState([]);

  useEffect(() => {
    if (!team) return;
    async function load() {
      const [td, log] = await Promise.all([
        fetchTeamTab(team.tabName),
        fetchCommitmentLog(),
      ]);
      setTeamData(td);
      setCommitments(log.filter(c => c.manager === team.manager));
    }
    load();
  }, [wigId]);

  if (!team) return <div className="p-6 text-red-400">WIG not found</div>;
  if (loading && !teamData) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  if (!teamData) return null;

  const currentWeekEntry = commitments.length > 0 ? commitments[commitments.length - 1] : null;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
          <h1 className="text-xl font-semibold">{team.name}</h1>
        </div>
        <p className="text-sm text-gray-500">{team.manager}</p>
      </div>

      {/* Score */}
      <div className="mb-8">
        <ScoreEditor
          score={teamData.score}
          target={team.target}
          color={team.color}
          onSave={async (val) => {
            await updateTeamScore(team.tabName, val);
            setTeamData(prev => ({ ...prev, score: val }));
          }}
        />
        {teamData.lastUpdated && (
          <p className="text-xs text-gray-600 mt-1">Last updated: {teamData.lastUpdated}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Milestones */}
        <MilestoneTable
          milestones={teamData.milestones}
          onStatusChange={async (row, status) => {
            await updateMilestoneStatus(team.tabName, row, status);
            setTeamData(prev => ({
              ...prev,
              milestones: prev.milestones.map(m => m.row === row ? { ...m, status } : m),
            }));
          }}
        />

        {/* Right: Commitments */}
        <div className="space-y-6">
          <CommitmentForm
            currentEntry={currentWeekEntry}
            onSave={async (lag, lead) => {
              if (currentWeekEntry) {
                await updateCommitment(currentWeekEntry.row, lag, lead);
                setCommitments(prev =>
                  prev.map(c => c.row === currentWeekEntry.row ? { ...c, lagResult: lag, leadCommitment: lead } : c)
                );
              }
            }}
          />
          <CommitmentHistory entries={commitments} />
        </div>
      </div>
    </div>
  );
}
```

**Step 6: Update App.jsx** to import WigDetailPage.

**Step 7: Commit**

```bash
git add dashboard/src/components/detail/ dashboard/src/pages/WigDetailPage.jsx dashboard/src/App.jsx
git commit -m "feat: add WIG detail page with score editor, milestones, and commitment form"
```

---

## Task 9: Meeting Page (Read + Write)

**Files:**
- Create: `dashboard/src/pages/MeetingPage.jsx`
- Create: `dashboard/src/components/meeting/AttendanceList.jsx`
- Create: `dashboard/src/components/meeting/AOBNotes.jsx`
- Create: `dashboard/src/components/meeting/ChairSelector.jsx`

**Step 1: Create AttendanceList**

`dashboard/src/components/meeting/AttendanceList.jsx`:

```jsx
export default function AttendanceList({ attendance, onToggle }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Attendance</h3>
      <div className="space-y-1">
        {attendance.map((a, i) => (
          <label key={a.manager} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-800/30 rounded px-2 -mx-2">
            <input
              type="checkbox"
              checked={a.present}
              onChange={() => onToggle(i, !a.present)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">{a.manager}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create AOBNotes**

`dashboard/src/components/meeting/AOBNotes.jsx`:

```jsx
import { useState } from 'react';

export default function AOBNotes({ notes, onSave }) {
  const [value, setValue] = useState(notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(value);
    setSaving(false);
  }

  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Any Other Business</h3>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500 resize-none"
        placeholder="Meeting notes..."
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-2 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </button>
    </div>
  );
}
```

**Step 3: Create ChairSelector**

`dashboard/src/components/meeting/ChairSelector.jsx`:

```jsx
import { MANAGERS } from '../../config/teams';

export default function ChairSelector({ currentChair, onSelect }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Next Chair</h3>
      <select
        value={currentChair}
        onChange={e => onSelect(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
      >
        <option value="">Select...</option>
        {MANAGERS.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}
```

**Step 4: Create MeetingPage**

`dashboard/src/pages/MeetingPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useSheets } from '../hooks/useSheets';
import AttendanceList from '../components/meeting/AttendanceList';
import AOBNotes from '../components/meeting/AOBNotes';
import ChairSelector from '../components/meeting/ChairSelector';

export default function MeetingPage() {
  const { fetchMeeting, fetchDashboard, updateAttendance, updateAOBNotes, updateNextChair, loading } = useSheets();
  const [meeting, setMeeting] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    async function load() {
      const [m, d] = await Promise.all([fetchMeeting(), fetchDashboard()]);
      setMeeting(m);
      setDashboardData(d);
    }
    load();
  }, []);

  if (loading && !meeting) return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  if (!meeting) return null;

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1">WIG Meeting</h1>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Date: {meeting.date || '—'}</span>
          <span>Chair: {meeting.chair || '—'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <AttendanceList
            attendance={meeting.attendance}
            onToggle={async (index, present) => {
              await updateAttendance(index, present);
              setMeeting(prev => ({
                ...prev,
                attendance: prev.attendance.map((a, i) =>
                  i === index ? { ...a, present } : a
                ),
              }));
            }}
          />

          {/* Scoreboard snapshot */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Scoreboard</h3>
            <div className="space-y-1">
              {dashboardData.map(d => (
                <div key={d.wig.wig} className="flex items-center py-1 text-sm">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: d.wig.color }} />
                  <span className="text-gray-300 flex-1">{d.wig.shortName}</span>
                  <span className="text-gray-400 font-medium">{d.score || '—'}</span>
                  <span className="text-gray-500 ml-2 w-6 text-center">{d.trend}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AOBNotes
            notes={meeting.aobNotes}
            onSave={async (notes) => {
              await updateAOBNotes(notes);
              setMeeting(prev => ({ ...prev, aobNotes: notes }));
            }}
          />
          <ChairSelector
            currentChair={meeting.nextChair}
            onSelect={async (name) => {
              await updateNextChair(name);
              setMeeting(prev => ({ ...prev, nextChair: name }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Update App.jsx** to import MeetingPage.

**Step 6: Commit**

```bash
git add dashboard/src/components/meeting/ dashboard/src/pages/MeetingPage.jsx dashboard/src/App.jsx
git commit -m "feat: add meeting page with attendance, AOB notes, and chair selector"
```

---

## Task 10: Final App.jsx Assembly + Google Cloud Setup Guide

**Files:**
- Modify: `dashboard/src/App.jsx` (final wiring)
- Create: `dashboard/GOOGLE_SETUP.md`

**Step 1: Finalize App.jsx**

Ensure all page imports are in place and routes are wired:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import WigDetailPage from './pages/WigDetailPage';
import MeetingPage from './pages/MeetingPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="wig/:wigId" element={<WigDetailPage />} />
              <Route path="meeting" element={<MeetingPage />} />
            </Route>
          </Routes>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 2: Write Google Cloud setup guide**

`dashboard/GOOGLE_SETUP.md` — step-by-step instructions for:

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create OAuth 2.0 credentials (Web Application type)
4. Add authorized JavaScript origins (http://localhost:5173 for dev, production URL later)
5. Create an API key (restrict to Sheets API)
6. Copy the Client ID, API Key, and Sheet ID into `.env`

**Step 3: Commit**

```bash
git add dashboard/
git commit -m "feat: finalize app assembly and add Google Cloud setup guide"
```

---

## Task 11: Build Verification + Production Config

**Step 1: Verify production build**

```bash
cd ~/projects/ets-wig-hub/dashboard
npm run build
```

Expected: `dist/` directory with compiled assets, no errors.

**Step 2: Test production build locally**

```bash
npx serve dist
```

Expected: App loads at http://localhost:3000.

**Step 3: Commit and tag**

```bash
cd ~/projects/ets-wig-hub
git add dashboard/
git commit -m "chore: verify production build"
git tag -a v2.0 -m "ETS WIG Hub v2.0 — dashboard frontend"
```

---

## Summary

| Task | What it builds |
|------|---------------|
| 1 | Vite + React + Tailwind scaffold |
| 2 | Team config + Sheets config + env setup |
| 3 | Google OAuth hook + sign-in gate |
| 4 | Sheets API read/write hook + auth context |
| 5 | Three-panel layout + sidebar + routing |
| 6 | Concentric rings SVG visualization |
| 7 | Dashboard page (rings + table + commitment status) |
| 8 | WIG detail page (score editor, milestones, commitments) |
| 9 | Meeting page (attendance, AOB, chair selector) |
| 10 | Final assembly + Google Cloud setup guide |
| 11 | Build verification + production config |
