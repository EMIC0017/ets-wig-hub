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
