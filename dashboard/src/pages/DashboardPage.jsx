import { useState, useEffect } from 'react';
import { useSheets } from '../hooks/useSheets';
import ConcentricRings from '../components/rings/ConcentricRings';
import DashboardTable from '../components/dashboard/DashboardTable';
import CommitmentStatus from '../components/dashboard/CommitmentStatus';

export default function DashboardPage() {
  const { fetchDashboard, fetchCommitmentLog, loading, error } = useSheets();
  const [dashboardData, setDashboardData] = useState([]);
  const [commitments, setCommitments] = useState([]);

  useEffect(() => {
    async function load() {
      const [dash, log] = await Promise.all([fetchDashboard(), fetchCommitmentLog()]);
      setDashboardData(dash);
      setCommitments(log);
    }
    load();
  }, []);

  if (loading && !dashboardData.length) {
    return <div className="p-6 text-gray-500 text-sm">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400 text-sm">Error: {error}</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        <div className="flex justify-center mb-8">
          <ConcentricRings dashboardData={dashboardData} />
        </div>
        <DashboardTable dashboardData={dashboardData} />
      </div>
      <CommitmentStatus commitments={commitments} />
    </div>
  );
}
