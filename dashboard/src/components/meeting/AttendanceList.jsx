export default function AttendanceList({ attendance, onToggle }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Attendance</h3>
      <div className="space-y-1">
        {attendance.map((a, i) => (
          <label key={a.manager} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-800/30 rounded px-2 -mx-2">
            <input
              type="checkbox"
              checked={a.present}
              onChange={() => onToggle(i, !a.present)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">{a.manager}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
