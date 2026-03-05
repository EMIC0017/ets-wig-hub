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
