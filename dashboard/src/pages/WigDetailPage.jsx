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
