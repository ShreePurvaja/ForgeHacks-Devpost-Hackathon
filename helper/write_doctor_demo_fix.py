import sys

TARGET = r"d:\Data Science\SIH\Datathon-CIT\frontend\src\components\RoleDoctorView.tsx"

content = """\
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Activity, RefreshCw, FileText, Check, Calendar, Plus, UploadCloud, Bell
} from 'lucide-react';
import { 
  Claim, fetchSurgeryReadiness, fetchSurgeries, Surgery, 
  bookSurgeryApi, orderScanApi, fetchDoctorNotifications, DoctorNotification
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

  // Real DB States
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAnesthesiaModal, setShowAnesthesiaModal] = useState(false);
  const [anesthesiaCleared, setAnesthesiaCleared] = useState(false);
  const [doctorScheduleText, setDoctorScheduleText] = useState<string>('Aug 22 Free Block');

  // Book Surgery Form
  const [patientName, setPatientName] = useState('Robert Johnson');
  const [procedureName, setProcedureName] = useState('Coronary Artery Bypass Graft (CABG)');
  const [scheduledTime, setScheduledTime] = useState('Tomorrow 10:00 AM');
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

  useEffect(() => {
    loadReadinessData(selectedClaimId);
    loadSurgeriesData();
    loadNotificationsData();
    const interval = setInterval(() => {
      loadReadinessData(selectedClaimId);
      loadSurgeriesData();
      loadNotificationsData();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedClaimId]);

  // Automated Demo Steps for Doctor View (Steps 10-13)
  useEffect(() => {
    if (!demo.isActive || demo.isPaused) return;

    // Step 10: Arrived at Doctor Cockpit -> Automatically trigger Readiness Audit
    if (demo.currentStepIndex === 9 && demoExecutedStepRef.current !== 9) {
      demoExecutedStepRef.current = 9;
      setActiveTab('OVERVIEW');
      loadNotificationsData();
      loadReadinessData('CLM001');
      const timer = setTimeout(() => {
        demoEngine.nextStep(); // Move to Step 11
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Step 11: Inspect Readiness Audit (Score 100%) -> Move to Step 12
    if (demo.currentStepIndex === 10 && demoExecutedStepRef.current !== 10) {
      demoExecutedStepRef.current = 10;
      loadReadinessData('CLM001');
      readinessRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = setTimeout(() => {
        demoEngine.nextStep(); // Move to Step 12
      }, 3000);
      return () => clearTimeout(timer);
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
          demoEngine.nextStep(); // Move to Step 13 (Demo Complete)
        }, 2200);
      }, 1500);

      return () => clearTimeout(timer1);
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
    <div className="space-y-8 animate-slide-up pb-24">
      {/* Doctor Notifications Stream Banner */}
      {notifications.length > 0 && (
        <div className="rounded-3xl border border-blue-300 bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 p-5 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-blue-800/80 pb-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
                <Bell className="h-5 w-5 animate-bounce" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Doctor Roster Notification Stream
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30">
                    {notifications.length} Notifications
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Live notifications dispatched from Admin Command Center & Event Bus
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="rounded-xl border border-blue-500/30 bg-blue-950/60 p-3 text-xs flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-blue-200">{notif.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{notif.message}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded shrink-0">
                  {notif.type || 'URGENT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Dr. Sarah Jenkins Cockpit</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                Cardiothoracic Surgery
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-Op EHR Vitals, Anesthesia Risk, Surgery Readiness & Lab Scan Orders
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAnesthesiaModal(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>{anesthesiaCleared ? 'ASA Risk Assessed ✓' : 'Anesthesia Risk Assessment'}</span>
          </button>

          <button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <UploadCloud className="h-3.5 w-3.5 text-blue-600" />
            <span>Order Lab Scan</span>
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs active:scale-95"
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
              <div ref={readinessRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Surgery Readiness Scorecard
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Target Patient: Patient #pat001 (Robert Johnson)</p>
                  </div>

                  <select
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CLM001">Claim CLM001 (CABG Surgery)</option>
                    <option value="CLM002">Claim CLM002 (Knee Replacement)</option>
                  </select>
                </div>

                {readiness && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Score</span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-4xl font-extrabold text-slate-900">{readiness.readiness_score}%</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                            {readiness.status_label}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-48 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Verification Progress</span>
                          <span>{readiness.readiness_score}/100</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${readiness.readiness_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pre-Op Clinical Checkpoints</h4>

                  {readiness?.checkpoints.map((cp, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                        cp.ready
                          ? 'border-blue-200 bg-blue-50/20 text-slate-900'
                          : 'border-slate-200 bg-slate-50/50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {cp.ready ? (
                          <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-bold text-slate-900">{cp.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Domain Check: {cp.name.split(' ')[0]}</p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          cp.ready
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cp.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Logged under NIST AI RMF governance matrix.</p>

                  <button
                    onClick={() => setClearanceApproved(true)}
                    disabled={clearanceApproved}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition ${
                      clearanceApproved
                        ? 'bg-blue-800 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Book Operation Room</h3>
            <form onSubmit={handleBookSurgery} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Procedure</label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Order Pre-Op Diagnostic Scan</h3>
            {scanMessage ? (
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                ✓ {scanMessage}
              </div>
            ) : (
              <form onSubmit={handleOrderScan} className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scan Type</label>
                  <input
                    type="text"
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority</label>
                  <select
                    value={scanPriority}
                    onChange={(e) => setScanPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"
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
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-white font-bold shadow-md hover:bg-blue-700 transition"
                  >
                    Dispatch Order to Lab Tech
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
"""

import codecs
with codecs.open(TARGET, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done, lines:", content.count('\n'))
