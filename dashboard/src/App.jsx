import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';

function WigDetailPage() {
  return <div className="p-6">WIG Detail — coming soon</div>;
}

function MeetingPage() {
  return <div className="p-6">Meeting — coming soon</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="wig/:wigId" element={<WigDetailPage />} />
              <Route path="meeting" element={<MeetingPage />} />
            </Route>
          </Routes>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
