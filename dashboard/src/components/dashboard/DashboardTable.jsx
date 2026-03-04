import { useNavigate } from 'react-router-dom';

export default function DashboardTable({ dashboardData }) {
  const navigate = useNavigate();

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
          <th className="text-left py-2 px-3 font-medium">WIG</th>
          <th className="text-left py-2 px-3 font-medium">Manager</th>
          <th className="text-left py-2 px-3 font-medium">Score</th>
          <th className="text-left py-2 px-3 font-medium">Target</th>
          <th className="text-center py-2 px-3 font-medium">Trend</th>
          <th className="text-left py-2 px-3 font-medium">Updated</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.map(d => (
          <tr
            key={d.wig.wig}
            onClick={() => navigate(`/wig/${d.wig.wig}`)}
            className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
          >
            <td className="py-2.5 px-3">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: d.wig.color }} />
              {d.wig.shortName}
            </td>
            <td className="py-2.5 px-3 text-gray-400">{d.wig.manager}</td>
            <td className="py-2.5 px-3 font-medium">{d.score || '—'}</td>
            <td className="py-2.5 px-3 text-gray-400">{d.target}</td>
            <td className="py-2.5 px-3 text-center text-lg">{d.trend}</td>
            <td className="py-2.5 px-3 text-gray-500 text-xs">{d.lastUpdated || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
