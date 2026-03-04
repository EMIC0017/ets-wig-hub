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
