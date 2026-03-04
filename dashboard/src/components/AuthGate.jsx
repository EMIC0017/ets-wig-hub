import { useAuthContext } from '../context/AuthContext';

export default function AuthGate({ children }) {
  const { isSignedIn, loading, signIn } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-100 mb-2">ETS WIG Hub</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in with your Google account to access the dashboard.</p>
          <button
            onClick={signIn}
            className="px-5 py-2.5 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return children;
}
