import { TEAMS } from '../../config/teams';

export default function CommitmentStatus({ commitments }) {
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
            <span className="w-12 text-center">{hasLag ? '\u2705' : '\u274C'}</span>
            <span className="w-12 text-center">{hasLead ? '\u2705' : '\u274C'}</span>
          </div>
        );
      })}
      <div className="mt-3 text-[11px] text-gray-600">
        {'\u2705'} = submitted &nbsp; {'\u274C'} = missing
      </div>
    </div>
  );
}

function getCurrentWeekEntries(commitments) {
  if (!commitments.length) return [];
  const latestWeek = commitments[commitments.length - 1]?.weekEnding;
  if (!latestWeek) return [];
  return commitments.filter(c => c.weekEnding === latestWeek);
}
