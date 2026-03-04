import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthContext } from '../../context/AuthContext';

export default function Layout() {
  const { user, signOut } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-12 border-b border-gray-800 flex items-center justify-end px-4 gap-3">
          {user && (
            <>
              <span className="text-sm text-gray-400">{user.name}</span>
              {user.picture && (
                <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
              )}
            </>
          )}
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
