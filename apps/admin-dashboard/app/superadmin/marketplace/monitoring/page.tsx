import { getMonitoringStats, getRiskReport } from './actions';
import MonitoringClient from './MonitoringClient';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  const [stats, initialRisks] = await Promise.all([
    getMonitoringStats(),
    getRiskReport(),
  ]);

  return (
    <MonitoringClient 
      initialStats={stats} 
      initialRisks={initialRisks} 
    />
  );
}
