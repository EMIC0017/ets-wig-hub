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
