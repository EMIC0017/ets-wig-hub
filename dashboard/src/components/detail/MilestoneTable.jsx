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
