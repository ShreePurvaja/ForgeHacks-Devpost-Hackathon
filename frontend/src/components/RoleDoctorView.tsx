'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Activity, RefreshCw, FileText, Check, Calendar, Plus, UploadCloud, Bell, X, Sparkles, Cpu
} from 'lucide-react';
import { 
  Claim, fetchSurgeryReadiness, fetchSurgeries, Surgery, 
  bookSurgeryApi, orderScanApi, fetchDoctorNotifications, DoctorNotification,
  fetchPatients, PatientRecord
} from '@/lib/api';
import DoctorSidebarNav, { DoctorNavTab } from './DoctorSidebarNav';
import EhrVitalsWidget from './EhrVitalsWidget';
import AnesthesiaRiskModal from './AnesthesiaRiskModal';
import DoctorCalendarWidget from './DoctorCalendarWidget';
import DoctorAnalyticsGraphs from './DoctorAnalyticsGraphs';
import DoctorAgentFlowPanel from './DoctorAgentFlowPanel';
import DoctorFloatingChatbot from './DoctorFloatingChatbot';
import { useDemoEngine, demoEngine } from '@/lib/demoEngine';

interface Checkpoint {
  name: string;
  status: string;
  ready: boolean;
}

interface ReadinessData {
  claim_id: string;
  readiness_score: number;
  status_label: string;
  checkpoints: Checkpoint[];
  last_updated: string;
}

interface RoleDoctorViewProps {
  claims: Claim[];
  onRefresh: () => void;
}

export default function RoleDoctorView({ claims, onRefresh }: RoleDoctorViewProps) {
  const [activeTab, setActiveTab] = useState<DoctorNavTab>('OVERVIEW');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('CLM001');
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [clearanceApproved, setClearanceApproved] = useState(false);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showFinalSummaryModal, setShowFinalSummaryModal] = useState(false);

  // Real DB States
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat001');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAnesthesiaModal, setShowAnesthesiaModal] = useState(false);
  const [anesthesiaCleared, setAnesthesiaCleared] = useState(false);
  const [doctorScheduleText, setDoctorScheduleText] = useState<string>('Aug 22 Free Block');

  // Book Surgery Form
  const [patientName, setPatientName] = useState('Robert Johnson');
  const [procedureName, setProcedureName] = useState('Coronary Artery Bypass Graft (CABG)');
  const [scheduledTime, setScheduledTime] = useState('Tomorrow 10:30 AM');
  const [operatingTheater, setOperatingTheater] = useState('OT #1');

  // Order Scan Form
  const [scanName, setScanName] = useState('Pre-Op Cardiac CT Scan');
  const [scanPriority, setScanPriority] = useState('URGENT');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Demo Engine Integration
  const demo = useDemoEngine();
  const demoExecutedStepRef = useRef<number>(-1);
  const readinessRef = useRef<HTMLDivElement>(null);

  const loadReadinessData = async (claimId: string) => {
    setLoadingReadiness(true);
    const data = await fetchSurgeryReadiness(claimId);
    if (data) setReadiness(data);
    setLoadingReadiness(false);
  };

  const loadSurgeriesData = async () => {
    const data = await fetchSurgeries();
    setSurgeries(data);
  };

  const loadNotificationsData = async () => {
    const notifs = await fetchDoctorNotifications('DOC001');
    setNotifications(notifs);
  };

  const loadPatientsData = async () => {
    const pts = await fetchPatients();
    setPatientsList(pts);
  };

  useEffect(() => {
    loadReadinessData(selectedClaimId);
    loadSurgeriesData();
    loadNotificationsData();
    loadPatientsData();
    const interval = setInterval(() => {
      loadReadinessData(selectedClaimId);
      loadSurgeriesData();
      loadNotificationsData();
      loadPatientsData();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedClaimId]);

  // Automated Demo Steps for Doctor View (Steps 10-15)
  useEffect(() => {
    if (!demo.isActive || demo.isPaused) return;

    // Step 10: Arrived at Doctor Cockpit -> Automatically load Notifications & Readiness Audit
    if (demo.currentStepIndex === 9 && demoExecutedStepRef.current !== 9) {
      demoExecutedStepRef.current = 9;
      setActiveTab('OVERVIEW');
      loadNotificationsData();
      loadReadinessData('CLM001');
      return;
    }

    // Step 11: Inspect Readiness Audit (Score 100%)
    if (demo.currentStepIndex === 10 && demoExecutedStepRef.current !== 10) {
      demoExecutedStepRef.current = 10;
      setActiveTab('OVERVIEW');
      loadReadinessData('CLM001');
      readinessRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Step 12: Order Diagnostic Scan -> Open Scan Modal, fill form, & submit to Lab Tech
    if (demo.currentStepIndex === 11 && demoExecutedStepRef.current !== 11) {
      demoExecutedStepRef.current = 11;
      setShowScanModal(true);
      setScanName('Pre-Op Cardiac CT Scan');
      setScanPriority('URGENT');

      const timer1 = setTimeout(async () => {
        try {
          const res = await orderScanApi({
            doctor_id: 'DOC001',
            doctor_name: 'Dr. Sarah Jenkins',
            patient_id: 'pat001',
            patient_name: 'Robert Johnson',
            scan_name: 'Pre-Op Cardiac CT Scan',
            priority: 'URGENT',
            uploaded_by: 'Dr. Sarah Jenkins'
          });
          setScanMessage(res.message || 'Scan ordered & dispatched to Lab Tech!');
        } catch (e) {}

        setTimeout(() => {
          setShowScanModal(false);
          setScanMessage(null);
        }, 1600);
      }, 1200);

      return () => clearTimeout(timer1);
    }

    // Step 13: Run Doctor Readiness Agent & Update Doctor Calendar
    if (demo.currentStepIndex === 12 && demoExecutedStepRef.current !== 12) {
      demoExecutedStepRef.current = 12;
      setActiveTab('READINESS_AGENT');
      setDoctorScheduleText('Aug 22 (10:30 AM) CABG — Robert Johnson (Ready 100%)');
      loadSurgeriesData();
      return;
    }

    // Step 14: 5-Second Inspection Halt on Doctor Readiness Agent Result
    if (demo.currentStepIndex === 13 && demoExecutedStepRef.current !== 13) {
      demoExecutedStepRef.current = 13;
      setActiveTab('READINESS_AGENT');
      return;
    }

    // Step 15: Show Final Crisp Operation Summary Modal Overlay (after 5s halt finishes)
    if (demo.currentStepIndex === 14 && demoExecutedStepRef.current !== 14) {
      demoExecutedStepRef.current = 14;
      setActiveTab('OVERVIEW');
      setShowFinalSummaryModal(true);
      return;
    }
  }, [demo.isActive, demo.currentStepIndex, demo.isPaused]);


  const handleBookSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookSurgeryApi({
        doctor_id: 'DOC001',
        doctor_name: 'Dr. Sarah Jenkins',
        patient_id: 'pat001',
        patient_name: patientName,
        procedure_name: procedureName,
        operating_theater: operatingTheater,
        scheduled_time: scheduledTime,
        readiness_score: 85
      });
      setShowBookModal(false);
      loadSurgeriesData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await orderScanApi({
        doctor_id: 'DOC001',
        doctor_name: 'Dr. Sarah Jenkins',
        patient_id: 'pat001',
        patient_name: 'Robert Johnson',
        scan_name: scanName,
        priority: scanPriority,
        uploaded_by: 'Dr. Sarah Jenkins'
      });
      setScanMessage(res.message || 'Scan ordered & dispatched to Lab Tech!');
      setTimeout(() => {
        setShowScanModal(false);
        setScanMessage(null);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-24 relative text-zinc-900">
      {/* Top Banner with Bell Icon on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900">Dr. Sarah Jenkins Cockpit</h2>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 border border-zinc-200 uppercase tracking-wider">
                Cardiothoracic Surgery
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-normal leading-relaxed">
              Pre-Op EHR Vitals, Anesthesia Risk, Surgery Readiness & Lab Scan Orders
            </p>
          </div>
        </div>

        {/* Action Buttons & Top Right Notification Bell */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Top Right Bell Icon with Unread Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative"
              title="Doctor Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl space-y-3 text-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-zinc-600" />
                    Doctor Roster Notifications ({notifications.length})
                  </h4>
                  <button onClick={() => setShowNotificationsDropdown(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-2">No new notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{notif.title}</span>
                          <span className="text-[9px] font-semibold text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200 uppercase">
                            {notif.type || 'URGENT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 leading-snug">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAnesthesiaModal(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
            <span>{anesthesiaCleared ? 'ASA Risk Assessed ✓' : 'Anesthesia Risk Assessment'}</span>
          </button>

          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <UploadCloud className="h-3.5 w-3.5 text-zinc-600" />
            <span>Order Lab Scan</span>
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-sm active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Book Operation</span>
          </button>
        </div>
      </div>

      {/* Main SaaS Dashboard Layout: Left Sidebar + Center Dashboard Content */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        
        {/* Left Sidebar Navigation */}
        <DoctorSidebarNav activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center Main Dashboard Area */}
        <div className="flex-1 w-full space-y-8">
          
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8">
              {/* EHR Vitals Widget */}
              <EhrVitalsWidget />

              {/* Surgical Performance Graphs */}
              <DoctorAnalyticsGraphs />

              {/* Operations Calendar */}
              <DoctorCalendarWidget surgeries={surgeries} doctorScheduleText={doctorScheduleText} />

              {/* Surgery Readiness Scorecard */}
              <div ref={readinessRef} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 text-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-zinc-800" />
                      Surgery Readiness Scorecard
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Target Patient: Patient #pat001 (Robert Johnson)</p>
                  </div>

                  <select
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <option value="CLM001">Claim CLM001 (CABG Surgery)</option>
                    <option value="CLM002">Claim CLM002 (Knee Replacement)</option>
                  </select>
                </div>

                {readiness && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Overall Score</span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-4xl font-bold text-zinc-900">{readiness.readiness_score}%</span>
                          <span className="text-xs font-semibold px-3 py-1 rounded-md border bg-zinc-900 text-white border-zinc-900 uppercase tracking-wider">
                            {readiness.status_label}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-48 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-700">
                          <span>Verification Progress</span>
                          <span>{readiness.readiness_score}/100</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                            style={{ width: `${readiness.readiness_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Pre-Op Clinical Checkpoints</h4>

                  {readiness?.checkpoints.map((cp, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-xl border p-4 transition ${
                        cp.ready
                          ? 'border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-zinc-900'
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {cp.ready ? (
                          <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-zinc-200 text-zinc-500 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold text-zinc-900">{cp.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 font-normal">Domain Check: {cp.name.split(' ')[0]}</p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-md border ${
                          cp.ready
                            ? 'bg-zinc-100 text-zinc-800 border-zinc-200 uppercase tracking-wider'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {cp.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Logged under NIST AI RMF governance matrix.</p>

                  <button
                    onClick={() => setClearanceApproved(true)}
                    disabled={clearanceApproved}
                    className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition ${
                      clearanceApproved
                        ? 'bg-zinc-800 cursor-default'
                        : 'bg-zinc-900 hover:bg-zinc-800 active:scale-95'
                    }`}
                  >
                    {clearanceApproved ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Surgery Clearance Approved</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Approve Surgery Clearance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CALENDAR' && (
            <div className="space-y-8">
              <DoctorCalendarWidget surgeries={surgeries} doctorScheduleText={doctorScheduleText} />
            </div>
          )}

          {(activeTab === 'READINESS_AGENT' || activeTab === 'CLEARANCE_AGENT' || activeTab === 'DISPATCH_SCAN_AGENT') && (
            <DoctorAgentFlowPanel agentTab={activeTab} />
          )}

        </div>
      </div>

      {/* Floating AI Assistant Chatbot */}
      <DoctorFloatingChatbot
        onScheduleUpdated={() => {
          setDoctorScheduleText('Aug 22 (10:00 AM - 02:00 PM) Free');
          loadSurgeriesData();
        }}
      />

      {/* Anesthesia Risk Assessment Modal */}
      <AnesthesiaRiskModal
        isOpen={showAnesthesiaModal}
        onClose={() => setShowAnesthesiaModal(false)}
        patientName="Robert Johnson"
        onCompleteAssessment={() => setAnesthesiaCleared(true)}
      />

      {/* Book Surgery Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-zinc-900">
            <h3 className="text-base font-bold text-zinc-900">Book Operation Room</h3>
            <form onSubmit={handleBookSurgery} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Procedure</label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-white font-semibold shadow-sm hover:bg-zinc-800"
                >
                  Book Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Diagnostic Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 animate-slide-up">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-zinc-900">
            <h3 className="text-base font-bold text-zinc-900">Order Pre-Op Diagnostic Scan</h3>
            {scanMessage ? (
              <div className="p-4 rounded-xl bg-zinc-100 text-zinc-900 text-xs font-semibold border border-zinc-200">
                ✓ {scanMessage}
              </div>
            ) : (
              <form onSubmit={handleOrderScan} className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Scan Type</label>
                  <input
                    type="text"
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-semibold text-zinc-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Priority</label>
                  <select
                    value={scanPriority}
                    onChange={(e) => setScanPriority(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-semibold text-zinc-900"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScanModal(false)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-white font-semibold shadow-sm hover:bg-zinc-800 transition"
                  >
                    Dispatch Order to Lab Tech
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Final Crisp Operation Summary Dialog Box Overlay */}
      {showFinalSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-slide-up">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    Operation End-to-End Summary
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 border border-zinc-200 uppercase tracking-wider">
                      Cleared & Ready
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500">Multi-Agent Intelligence Flow Complete</p>
                </div>
              </div>
              <button
                onClick={() => setShowFinalSummaryModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Patient Info</span>
                <p className="font-bold text-zinc-900">Robert Johnson (pat001)</p>
                <p className="text-zinc-500 text-[11px]">Male • DOB: 1965-03-15</p>
              </div>

              <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Attending Surgeon</span>
                <p className="font-bold text-zinc-900">Dr. Sarah Jenkins</p>
                <p className="text-zinc-500 text-[11px]">Cardiothoracic Surgery</p>
              </div>

              <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scheduled Procedure</span>
                <p className="font-bold text-zinc-900">Coronary Artery Bypass Graft (CABG)</p>
                <p className="text-zinc-800 font-semibold text-[11px]">Operating Theatre #1</p>
              </div>

              <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Insurance Pre-Auth</span>
                <p className="font-bold text-zinc-900">APPROVED ✓</p>
                <p className="text-zinc-600 text-[11px]">Resolved via Voice Agent 5B</p>
              </div>

              <div className="rounded-xl bg-zinc-100 p-3 border border-zinc-200 space-y-1 col-span-1 sm:col-span-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Surgery Readiness Score</span>
                <p className="font-bold text-zinc-900 text-base">100% (5/5 Cleared)</p>
                <p className="text-zinc-600 text-[11px]">Ready for Surgery</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setShowFinalSummaryModal(false)}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition"
              >
                Close Operational Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
