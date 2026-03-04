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
