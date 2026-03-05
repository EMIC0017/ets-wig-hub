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
