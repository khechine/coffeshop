'use client';

import React, { useState, useTransition, useEffect, useMemo } from 'react';
import { Calendar, UserPlus, Clock, X, Check, Eye, AlertCircle, RefreshCw, FileText, ChevronLeft, ChevronRight, Download, BarChart3 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { clockInAction, clockOutAction, getAttendanceHistory, getMonthlyAttendanceReport } from '../../actions';

type TabType = 'registre' | 'rapport';

export default function PointageClient({ 
  initialAttendance, 
  staff 
}: { 
  initialAttendance: any[];
  staff: any[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>('registre');
  const [attendance, setAttendance] = useState<any[]>(initialAttendance);
  const [isPending, startTransition] = useTransition();

  // Date filters (registre)
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Month filter (rapport)
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedAttendanceId, setSelectedAttendanceId] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch history when dates change
  const handleFetchHistory = () => {
    startTransition(async () => {
      try {
        const records = await getAttendanceHistory(startDate, endDate);
        setAttendance(records);
      } catch (err: any) {
        setErrorMessage("Impossible de charger l'historique.");
      }
    });
  };

  useEffect(() => {
    handleFetchHistory();
  }, [startDate, endDate]);

  // Fetch monthly report data
  const fetchMonthlyReport = async () => {
    setIsLoadingReport(true);
    try {
      const data = await getMonthlyAttendanceReport('', reportYear, reportMonth);
      setMonthlyData(data);
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rapport') {
      fetchMonthlyReport();
    }
  }, [activeTab, reportMonth, reportYear]);

  // Handle manual clock in (Backoffice source)
  const handleManualClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    startTransition(async () => {
      try {
        setErrorMessage('');
        await clockInAction(selectedStaffId, 'BACKOFFICE');
        setShowAddModal(false);
        setSelectedStaffId('');
        handleFetchHistory();
      } catch (err: any) {
        setErrorMessage(err.message || "Erreur de pointage");
      }
    });
  };

  // Handle manual clock out
  const handleManualClockOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendanceId) return;

    startTransition(async () => {
      try {
        setErrorMessage('');
        await clockOutAction(selectedAttendanceId, clockOutNotes);
        setShowOutModal(false);
        setSelectedAttendanceId('');
        setClockOutNotes('');
        handleFetchHistory();
      } catch (err: any) {
        setErrorMessage(err.message || "Erreur lors du dépointage");
      }
    });
  };

  // Helper formatters
  const formatTime = (date: string | Date | null) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return 'En cours';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatHours = (minutes: number) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  // Monthly report computations
  const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const groupedByUser = useMemo(() => {
    const grouped: Record<string, any> = {};
    staff.forEach(employee => {
      grouped[employee.id] = {
        employee,
        daily: {} as Record<number, number>,
        totalMinutes: 0,
        daysWorked: 0
      };
      daysArray.forEach(day => { grouped[employee.id].daily[day] = 0; });
    });

    monthlyData.forEach((att: any) => {
      if (!att.clockOut || !att.duration) return;
      const clockInDate = new Date(att.clockIn);
      if (clockInDate.getMonth() + 1 === reportMonth && clockInDate.getFullYear() === reportYear) {
        const day = clockInDate.getDate();
        const userId = att.userId || att.user?.id;
        if (grouped[userId]) {
          grouped[userId].daily[day] += att.duration;
          grouped[userId].totalMinutes += att.duration;
        }
      }
    });

    // Count days worked
    Object.values(grouped).forEach((data: any) => {
      data.daysWorked = daysArray.filter(day => data.daily[day] > 0).length;
    });

    return grouped;
  }, [monthlyData, staff, daysArray, reportMonth, reportYear]);

  const totalHoursAllStaff = Object.values(groupedByUser).reduce((sum: number, d: any) => sum + d.totalMinutes, 0);
  const avgHoursPerEmployee = staff.length > 0 ? Math.round(totalHoursAllStaff / staff.length) : 0;

  const changeMonth = (offset: number) => {
    let newMonth = reportMonth + offset;
    let newYear = reportYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    else if (newMonth < 1) { newMonth = 12; newYear--; }
    setReportMonth(newMonth);
    setReportYear(newYear);
  };

  const handleExportCSV = () => {
    const headers = ['Employé', 'Rôle', ...daysArray.map(d => `${d}`), 'Total Heures', 'Jours Travaillés'];
    const rows = Object.values(groupedByUser).map((data: any) => [
      data.employee.name,
      data.employee.role === 'STORE_OWNER' ? 'Gérant' : 'Caissier',
      ...daysArray.map(day => data.daily[day] > 0 ? formatHours(data.daily[day]) : ''),
      formatHours(data.totalMinutes),
      data.daysWorked
    ]);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_pointage_${monthNames[reportMonth - 1]}_${reportYear}.csv`;
    link.click();
  };

  const fieldStyle: React.CSSProperties = { 
    width: '100%', padding: '12px 14px', borderRadius: '12px', 
    border: '1.5px solid #E2E8F0', fontSize: '15px', outline: 'none', background: '#fff',
    transition: 'all 0.2s ease'
  };
  
  const labelStyle: React.CSSProperties = { 
    display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748B', 
    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' 
  };

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 800,
    border: 'none',
    background: activeTab === tab ? '#4F46E5' : 'transparent',
    color: activeTab === tab ? '#fff' : '#64748B',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  });

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#F1F5F9', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        <button style={tabStyle('registre')} onClick={() => setActiveTab('registre')}>
          <FileText size={16} /> Registre
        </button>
        <button style={tabStyle('rapport')} onClick={() => setActiveTab('rapport')}>
          <BarChart3 size={16} /> Rapport Mensuel
        </button>
      </div>

      {/* ═══════════════ TAB 1: REGISTRE ═══════════════ */}
      {activeTab === 'registre' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '12px' }}>
                <Calendar size={16} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Du</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  style={{ border: 'none', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '12px' }}>
                <Calendar size={16} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Au</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  style={{ border: 'none', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                />
              </div>
              <button onClick={handleFetchHistory} disabled={isPending} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', borderRadius: '12px' }}>
                <RefreshCw size={14} className={isPending ? 'spin' : ''} /> Actualiser
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} /> Pointage Manuel
            </button>
          </div>

          {errorMessage && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Registre des Présences ({attendance.length})</span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employé</th>
                    <th>Source</th>
                    <th>Arrivée</th>
                    <th>Départ</th>
                    <th>Durée</th>
                    <th>Remarques</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>
                        {formatDate(record.clockIn)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{record.user?.name}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{record.user?.role}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 800, 
                          padding: '4px 8px', 
                          borderRadius: '100px',
                          background: record.source === 'POS' ? '#EEF2FF' : '#FFF7ED',
                          color: record.source === 'POS' ? '#4F46E5' : '#D97706'
                        }}>
                          {record.source}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        {formatTime(record.clockIn)}
                      </td>
                      <td style={{ fontWeight: 700, color: record.clockOut ? '#DC2626' : '#94A3B8' }}>
                        {formatTime(record.clockOut)}
                      </td>
                      <td style={{ fontWeight: 800, color: '#1E293B' }}>
                        {formatDuration(record.duration)}
                      </td>
                      <td style={{ color: '#475569', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.notes || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Aucune</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!record.clockOut && (
                          <button 
                            onClick={() => {
                              setSelectedAttendanceId(record.id);
                              setShowOutModal(true);
                            }} 
                            className="btn btn-ghost" 
                            style={{ color: '#EF4444', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2' }}
                          >
                            <Clock size={14} /> Dépointer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                        Aucune présence enregistrée pour cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ TAB 2: RAPPORT MENSUEL ═══════════════ */}
      {activeTab === 'rapport' && (
        <>
          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => changeMonth(-1)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '17px', color: '#1E293B', minWidth: '180px', justifyContent: 'center' }}>
                <Calendar size={18} style={{ color: '#4F46E5' }} />
                {monthNames[reportMonth - 1]} {reportYear}
              </div>
              <button onClick={() => changeMonth(1)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Exporter CSV
            </button>
          </div>

          {/* KPI Cards for the Month */}
          <div className="kpi-grid" style={{ marginBottom: '20px' }}>
            <div className="kpi-card blue">
              <div className="kpi-icon blue"><Clock size={22} /></div>
              <div>
                <div className="kpi-label">Total Heures (équipe)</div>
                <div className="kpi-value">{formatHours(totalHoursAllStaff)}</div>
              </div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-icon green"><BarChart3 size={22} /></div>
              <div>
                <div className="kpi-label">Moyenne / Employé</div>
                <div className="kpi-value">{formatHours(avgHoursPerEmployee)}</div>
              </div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-icon purple"><FileText size={22} /></div>
              <div>
                <div className="kpi-label">Pointages enregistrés</div>
                <div className="kpi-value">{monthlyData.filter((a: any) => a.clockOut).length}</div>
              </div>
            </div>
          </div>

          {/* Cross Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Tableau de Présence — {monthNames[reportMonth - 1]} {reportYear}</span>
              {isLoadingReport && <RefreshCw size={16} className="spin" style={{ color: '#4F46E5' }} />}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: `${200 + daysInMonth * 48}px` }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, background: '#F8FAFC', zIndex: 10, minWidth: '180px', borderRight: '2px solid #E2E8F0' }}>Employé</th>
                    <th style={{ textAlign: 'center', fontWeight: 800, background: '#F0FDF4', color: '#166534', minWidth: '70px', borderRight: '2px solid #E2E8F0' }}>Total</th>
                    <th style={{ textAlign: 'center', fontWeight: 800, background: '#F0F9FF', color: '#0C4A6E', minWidth: '50px', borderRight: '2px solid #E2E8F0' }}>Jours</th>
                    {daysArray.map(day => {
                      const dayOfWeek = new Date(reportYear, reportMonth - 1, day).getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <th key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, minWidth: '40px', color: isWeekend ? '#DC2626' : '#64748B', background: isWeekend ? '#FEF2F2' : '#F8FAFC' }}>
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(groupedByUser).map((data: any) => (
                    <tr key={data.employee.id}>
                      <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 5, borderRight: '2px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>
                            {data.employee.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{data.employee.name}</div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{data.employee.role === 'STORE_OWNER' ? 'Gérant' : 'Caissier'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#166534', background: '#F0FDF4', borderRight: '2px solid #E2E8F0' }}>
                        {formatHours(data.totalMinutes)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#0C4A6E', background: '#F0F9FF', borderRight: '2px solid #E2E8F0' }}>
                        {data.daysWorked}
                      </td>
                      {daysArray.map(day => {
                        const dayOfWeek = new Date(reportYear, reportMonth - 1, day).getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        return (
                          <td key={day} style={{ textAlign: 'center', fontSize: '11px', background: isWeekend ? '#FFFBEB' : 'transparent' }}>
                            {data.daily[day] > 0 ? (
                              <span style={{ display: 'inline-block', padding: '2px 6px', background: '#DCFCE7', color: '#166534', borderRadius: '6px', fontWeight: 700, fontSize: '10px' }}>
                                {formatHours(data.daily[day])}
                              </span>
                            ) : (
                              <span style={{ color: '#D1D5DB' }}>-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth + 3} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                        Aucun employé trouvé pour cette boutique.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Manual Clock In Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Pointage Manuel (Entrée)">
        <form onSubmit={handleManualClockIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Sélectionner l'employé</label>
            <select 
              style={fieldStyle} 
              value={selectedStaffId} 
              onChange={e => setSelectedStaffId(e.target.value)} 
              required
            >
              <option value="">-- Choisir un membre du personnel --</option>
              {staff.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : <><Check size={18} /> Valider l'entrée</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Clock Out Modal */}
      <Modal open={showOutModal} onClose={() => setShowOutModal(false)} title="Enregistrer le départ">
        <form onSubmit={handleManualClockOut} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Remarques / Observations</label>
            <textarea 
              style={{ ...fieldStyle, minHeight: '80px', fontFamily: 'inherit' }} 
              placeholder="ex: Départ anticipé, oubli de pointage à la caisse..."
              value={clockOutNotes}
              onChange={e => setClockOutNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowOutModal(false)}>Annuler</button>
            <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Valider la sortie'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
