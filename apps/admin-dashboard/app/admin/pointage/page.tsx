import { getStore, getTodayAttendance, getAllStaffForAttendance } from '../../actions';
import { Clock, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import PointageClient from './PointageClient';

export const dynamic = 'force-dynamic';

export default async function PointagePage() {
  const store = await getStore();
  const todayAttendance = await getTodayAttendance();
  const staff = await getAllStaffForAttendance();

  // Calculate quick stats
  const activeNow = todayAttendance.filter((a: any) => !a.clockOut);
  const completedToday = todayAttendance.filter((a: any) => a.clockOut);
  const totalDurationToday = completedToday.reduce((acc: number, a: any) => acc + (a.duration || 0), 0);
  
  const hoursToday = Math.floor(totalDurationToday / 60);
  const minsToday = totalDurationToday % 60;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Pointage & Présence</h1>
          <p>Visualisez les heures de présence de vos baristas et gérants pour <strong>{store?.name}</strong>.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Clock size={22} /></div>
          <div>
            <div className="kpi-label">Actifs en ce moment</div>
            <div className="kpi-value">{activeNow.length}</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><UserCheck size={22} /></div>
          <div>
            <div className="kpi-label">Pointages terminés</div>
            <div className="kpi-value">{completedToday.length}</div>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><CheckCircle2 size={22} /></div>
          <div>
            <div className="kpi-label">Cumul heures (Aujourd'hui)</div>
            <div className="kpi-value">{hoursToday}h {minsToday}m</div>
          </div>
        </div>
      </div>

      <PointageClient 
        initialAttendance={todayAttendance as any} 
        staff={staff as any} 
      />
    </div>
  );
}
