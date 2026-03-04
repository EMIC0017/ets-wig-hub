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
