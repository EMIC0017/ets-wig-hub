import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="min-h-screen bg-gray-950 text-gray-100">
          Authenticated — WIG Hub
        </div>
      </AuthGate>
    </AuthProvider>
  );
}
