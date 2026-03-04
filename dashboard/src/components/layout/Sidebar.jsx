import { NavLink } from 'react-router-dom';
import { TEAMS } from '../../config/teams';

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `block px-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-gray-800 text-gray-100'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
    }`;

  return (
    <aside className="w-56 border-r border-gray-800 p-4 flex flex-col gap-6">
      <NavLink to="/" className="text-base font-semibold text-gray-100 px-3">
        ETS WIG Hub
      </NavLink>

      <nav className="flex flex-col gap-0.5">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        <div className="mt-4 mb-1 px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          WIG Teams
        </div>
        {TEAMS.map(team => (
          <NavLink key={team.wig} to={`/wig/${team.wig}`} className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: team.color }} />
            {team.shortName}
          </NavLink>
        ))}
        <div className="mt-4 mb-1 px-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Process
        </div>
        <NavLink to="/meeting" className={linkClass}>Meeting</NavLink>
      </nav>
    </aside>
  );
}
