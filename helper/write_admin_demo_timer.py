import sys

TARGET = r"d:\Data Science\SIH\Datathon-CIT\frontend\src\components\RoleAdminView.tsx"

content = """\
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Zap, RefreshCw, Radio, Stethoscope, Bell, Check, X,
  PlusCircle, Bed, ShieldCheck, Cpu, Calendar, Clock, ChevronRight
} from 'lucide-react';
import { 
  PolicyUpdate, EscalationTicket, DashboardStats, 
  fetchHospitalEvents, fetchDoctors, Doctor,
  fetchHospitalCapacity, HospitalCapacity, fetchOtRequests, OtBookingRequest,
  decideOtRequest, createAdminOperation
} from '@/lib/api';
import PolicyUpdates from './PolicyUpdates';
import TicketsList from './TicketsList';
import AdminAgentFlowPanel, { AdminAgentTab } from './AdminAgentFlowPanel';
import AdminFloatingChatbot from './AdminFloatingChatbot';
import { useDemoEngine, demoEngine } from '@/lib/demoEngine';

interface RoleAdminViewProps {
  stats: DashboardStats | null;
  claims?: any[];
  policyUpdates: PolicyUpdate[];
  tickets: EscalationTicket[];
  onUploadSuccess?: () => void;
  onOpenWorkflowModal?: () => void;
  onRefresh: () => void;
}

interface EventItem {
  id: number;
  event_type: string;
  payload: any;
  source_agent: string;
  timestamp: string;
}

const DEFAULT_DOCTORS: Doctor[] = [
  { id: 'DOC001', name: 'Dr. Sarah Jenkins', specialty: 'Cardiothoracic Surgery', status: 'IN_SURGERY', current_location: 'Operating Theater #1', on_duty: 1, shift_timing: '08:00 AM - 05:00 PM' },
  { id: 'DOC002', name: 'Dr. Michael Chang', specialty: 'Orthopedic Surgery', status: 'AVAILABLE', current_location: 'OPD Clinic 3', on_duty: 1, shift_timing: '09:00 AM - 06:00 PM' },
  { id: 'DOC003', name: 'Dr. Elena Rostova', specialty: 'Neuro-Radiology', status: 'REGULAR_PATIENTS', current_location: 'OPD Clinic 5', on_duty: 1, shift_timing: '07:00 AM - 04:00 PM' },
  { id: 'DOC004', name: 'Dr. James Wilson', specialty: 'General Surgery', status: 'AVAILABLE', current_location: 'Emergency Ward', on_duty: 1, shift_timing: '12:00 PM - 09:00 PM' },
  { id: 'DOC005', name: 'Dr. Robert Vance', specialty: 'Anesthesiology', status: 'OFF_DUTY', current_location: 'Home', on_duty: 0, shift_timing: 'Off-Duty' }
];

export default function RoleAdminView({
  stats,
  claims = [],
  policyUpdates,
  tickets,
  onRefresh
}: RoleAdminViewProps) {
  const router = useRouter();

  // Compute recent rejected claims (last 5)
  const rejectedClaims = claims
    .filter(c => (c.decision || c.status || '').toUpperCase() === 'REJECTED')
    .slice(0, 5);

  // Main view navigation tab (Dashboard vs Admin Agents)
  const [activeMainTab, setActiveMainTab] = useState<'DASHBOARD' | 'AGENTS'>('DASHBOARD');
  const [selectedAgentTab, setSelectedAgentTab] = useState<AdminAgentTab>('OPERATION_CLAIMS_AGENT');

  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [capacity, setCapacity] = useState<HospitalCapacity>({
    total_beds: 150, occupied_beds: 108, available_beds: 42,
    total_ots: 8, in_use_ots: 3, maintenance_ots: 1, available_ots: 4
  });
  const [otRequests, setOtRequests] = useState<OtBookingRequest[]>([]);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Create Operation Modal State
  const [showCreateOpModal, setShowCreateOpModal] = useState(false);
  const [newOpForm, setNewOpForm] = useState({
    patient_name: 'Robert Johnson',
    doctor_id: 'DOC001',
    doctor_name: 'Dr. Sarah Jenkins',
    procedure_name: 'Coronary Artery Bypass Graft (CABG)',
    operating_theater: 'OT #1',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time_slot: '10:30 AM'
  });
  const [isSubmittingOp, setIsSubmittingOp] = useState(false);

  // Demo Engine Hook
  const demo = useDemoEngine();
  const adminDemoExecutedStepRef = useRef<number>(-1);

  const loadData = async () => {
    const [events, docs, cap, reqs] = await Promise.all([
      fetchHospitalEvents(50),
      fetchDoctors(),
      fetchHospitalCapacity(),
      fetchOtRequests('PENDING')
    ]);
    setEventsList(events);
    if (docs && docs.length > 0) setDoctorsList(docs);
    setCapacity(cap);
    setOtRequests(reqs);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Automated Demo Steps for Admin View (Steps 1-10)
  useEffect(() => {
    if (!demo.isActive || demo.isPaused || adminDemoExecutedStepRef.current === demo.currentStepIndex) return;

    // Step 2: Open Create Operation Modal & fill defaults
    if (demo.currentStepIndex === 1) {
      adminDemoExecutedStepRef.current = 1;
      setActiveMainTab('DASHBOARD');
      setShowCreateOpModal(true);
      setNewOpForm({
        patient_name: 'Robert Johnson',
        doctor_id: 'DOC001',
        doctor_name: 'Dr. Sarah Jenkins',
        procedure_name: 'Coronary Artery Bypass Graft (CABG)',
        operating_theater: 'OT #1',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time_slot: '10:30 AM'
      });
      return;
    }

    // Step 3: Create Operation Box 5s Inspection Halt -> Modal remains open while 5s timer ticks down!
    if (demo.currentStepIndex === 2) {
      adminDemoExecutedStepRef.current = 2;
      setShowCreateOpModal(true);
      return;
    }

    // Step 4: Submit Operation Form (uses whatever is in newOpForm)
    if (demo.currentStepIndex === 3) {
      adminDemoExecutedStepRef.current = 3;
      const submitOp = async () => {
        try {
          setIsSubmittingOp(true);
          const dObj = new Date(newOpForm.scheduled_date);
          const dateFormatted = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const fullScheduledTime = `${dateFormatted} at ${newOpForm.scheduled_time_slot}`;
          await createAdminOperation({
            doctor_id: newOpForm.doctor_id,
            doctor_name: newOpForm.doctor_name,
            patient_name: newOpForm.patient_name,
            procedure_name: newOpForm.procedure_name,
            operating_theater: newOpForm.operating_theater,
            scheduled_time: fullScheduledTime
          });
          setShowCreateOpModal(false);
          await loadData();
        } catch (e) {
          console.error(e);
        } finally {
          setIsSubmittingOp(false);
        }
      };
      submitOp();
      return;
    }

    // Step 5: Switch to Admin Agents Flow
    if (demo.currentStepIndex === 4) {
      adminDemoExecutedStepRef.current = 4;
      setActiveMainTab('AGENTS');
      setSelectedAgentTab('OPERATION_CLAIMS_AGENT');
      return;
    }

    // Step 10: Switch Role to Doctor View
    if (demo.currentStepIndex === 9) {
      adminDemoExecutedStepRef.current = 9;
      router.push('/doctor');
      return;
    }
  }, [demo.isActive, demo.currentStepIndex, demo.isPaused, router, newOpForm]);

  const handleOtDecision = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      setDecidingId(requestId);
      await decideOtRequest(requestId, decision);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setDecidingId(null);
    }
  };

  const handleCreateOperationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingOp(true);
      const dObj = new Date(newOpForm.scheduled_date);
      const dateFormatted = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const fullScheduledTime = `${dateFormatted} at ${newOpForm.scheduled_time_slot}`;

      await createAdminOperation({
        doctor_id: newOpForm.doctor_id,
        doctor_name: newOpForm.doctor_name,
        patient_name: newOpForm.patient_name,
        procedure_name: newOpForm.procedure_name,
        operating_theater: newOpForm.operating_theater,
        scheduled_time: fullScheduledTime
      });

      setShowCreateOpModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingOp(false);
    }
  };

  const handleDoctorSelectChange = (docId: string) => {
    const selectedDoc = doctorsList.find(d => d.id === docId);
    setNewOpForm(prev => ({
      ...prev,
      doctor_id: docId,
      doctor_name: selectedDoc ? selectedDoc.name : 'Dr. Sarah Jenkins'
    }));
  };

  return (
    <div className="space-y-8 animate-slide-up pb-24 relative">
      {/* Top Main Navigation Bar (Dashboard vs Admin Agents) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Hospital Operations Command Center</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                Admin Role
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Capacity, Color-Coded Doctor Roster, OT Booking Approvals, & Admin Agent Flow
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveMainTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'DASHBOARD'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Command Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveMainTab('AGENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'AGENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Admin Agents Flow</span>
          </button>

          <button
            onClick={() => setShowCreateOpModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <PlusCircle className="h-4 w-4 text-blue-400" />
            <span>Create Operation</span>
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {activeMainTab === 'AGENTS' ? (
        <AdminAgentFlowPanel
          agentTab={selectedAgentTab}
          onSelectAgentTab={(t) => setSelectedAgentTab(t)}
        />
      ) : (
        <div className="space-y-8">
          {/* Bed & OT Total Capacity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Beds */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Inpatient Beds</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Bed className="h-5 w-5" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{capacity.available_beds}</span>
                  <span className="text-xs font-bold text-slate-400">/ {capacity.total_beds} Total</span>
                </div>
                <p className="text-xs font-semibold text-blue-700 mt-0.5">Available Inpatient Beds</p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((capacity.occupied_beds / capacity.total_beds) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>Occupied: <strong>{capacity.occupied_beds}</strong></span>
                <span>Available: <strong className="text-blue-700">{capacity.available_beds}</strong></span>
              </div>
            </div>

            {/* Total Operating Theatres (OTs) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Theatres (OT)</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Stethoscope className="h-5 w-5" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{capacity.available_ots}</span>
                  <span className="text-xs font-bold text-slate-400">/ {capacity.total_ots} Total</span>
                </div>
                <p className="text-xs font-semibold text-blue-700 mt-0.5">Ready for Surgeries</p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((capacity.in_use_ots / capacity.total_ots) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>In Use: <strong>{capacity.in_use_ots}</strong></span>
                <span>Available: <strong className="text-blue-700">{capacity.available_ots}</strong></span>
              </div>
            </div>

            {/* Pending OT Booking Requests */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OT Booking Requests</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold relative">
                  <Bell className="h-5 w-5" />
                  {otRequests.length > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
                  )}
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-slate-900">{otRequests.length}</span>
                <p className="text-xs font-semibold text-blue-700 mt-0.5">Pending Admin Approval</p>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Doctor requests awaiting review</span>
              </div>
            </div>

            {/* Admin Agentic Control */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 space-y-3 shadow-xs hover:bg-blue-50/70 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Agentic Operations</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  <Cpu className="h-5 w-5" />
                </span>
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900">Groq LLM Active</span>
                <p className="text-xs text-blue-700 font-medium mt-0.5">Pre-Op Claims & Capacity Agent</p>
              </div>
              <button
                onClick={() => {
                  setActiveMainTab('AGENTS');
                  setSelectedAgentTab('OPERATION_CLAIMS_AGENT');
                }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <span>Launch Admin Agents</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Notification Bar for Pending OT Booking Requests */}
          {otRequests.length > 0 && (
            <div className="rounded-3xl border border-blue-300 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-6 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
                    <Bell className="h-5 w-5 animate-bounce" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Doctor OT Booking Requests Notification Bar
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-400/30">
                        {otRequests.length} Action Needed
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Doctors have requested Operating Theatre bookings. Review & click OK to approve and notify doctors instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4 space-y-3 hover:border-blue-400/60 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                        {req.urgency}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{req.id}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{req.procedure_name}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Patient: <strong>{req.patient_name}</strong> • Doctor: <strong>{req.doctor_name}</strong>
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-blue-200">
                        <span>Requested: <strong>{req.ot_room}</strong></span>
                        <span>Time: <strong>{req.scheduled_time}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOtDecision(req.id, 'REJECTED')}
                        disabled={decidingId === req.id}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <X className="h-3.5 w-3.5 text-red-400" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleOtDecision(req.id, 'APPROVED')}
                        disabled={decidingId === req.id}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95"
                      >
                        {decidingId === req.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Approve & Notify (OK)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color-Coded Doctor Roster Status Board */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  Doctor Roster & Availability Status Board
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live availability indicators: 🔴 Red = In Operation | 🟢 Green = Free / Available | 🟡 Yellow = Attending Regular Patients
                </p>
              </div>

              {/* Status Legend Badges */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
                  🔴 In Operation
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-800 px-2.5 py-1 rounded-full border border-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  🟢 Free / Available
                </span>
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  🟡 Regular Patients
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctorsList.map((doc) => {
                let dotColorClass = "bg-slate-400";
                let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                let statusText = doc.status.replace('_', ' ');

                if (doc.status === 'IN_SURGERY' || doc.status === 'IN_OPERATION') {
                  dotColorClass = "bg-blue-600 animate-pulse";
                  statusBadgeClass = "bg-blue-100 text-blue-800 border-blue-200 font-extrabold";
                  statusText = "🔴 IN OPERATION";
                } else if (doc.status === 'AVAILABLE') {
                  dotColorClass = "bg-slate-600";
                  statusBadgeClass = "bg-slate-100 text-slate-800 border-slate-200 font-extrabold";
                  statusText = "🟢 AVAILABLE (FREE)";
                } else if (doc.status === 'REGULAR_PATIENTS' || doc.status === 'ON_CALL') {
                  dotColorClass = "bg-blue-500";
                  statusBadgeClass = "bg-blue-50 text-blue-800 border-blue-200 font-extrabold";
                  statusText = "🟡 REGULAR PATIENTS";
                }

                return (
                  <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 hover:bg-white hover:border-blue-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{doc.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${dotColorClass}`} />
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-bold text-blue-700">{doc.current_location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Rejected Claims — light white card, last 5 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-red-500" />
                Recent Rejected Claims
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {rejectedClaims.length} Rejected
              </span>
            </div>

            {rejectedClaims.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No rejected claims found.</p>
            ) : (
              <div className="space-y-2">
                {rejectedClaims.map((claim, idx) => (
                  <div key={claim.id || idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 hover:bg-white hover:border-slate-200 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-500 shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {claim.patient_name || claim.patient_id || 'Unknown Patient'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {claim.description || claim.procedure_code || claim.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        REJECTED
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                        {claim.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Event Bus & Policy/Ticket Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-600" />
                    Hospital Real-Time Event Bus Stream
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {eventsList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No events published yet.</p>
                  ) : (
                    eventsList.slice(0, 10).map((evt) => (
                      <div key={evt.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700">{evt.event_type}</span>
                          <span className="text-[10px] text-slate-400">{evt.source_agent}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono truncate">{JSON.stringify(evt.payload)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <PolicyUpdates policies={policyUpdates} />
              <TicketsList tickets={tickets} />
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Operation Modal with Date Picker & Doctor Selection Dropdown */}
      {showCreateOpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Create & Schedule Operation</h3>
                  <p className="text-xs text-slate-500">Assign doctor, reserve OT, pick date, and notify doctor</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateOpModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOperationSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={newOpForm.patient_name}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, patient_name: e.target.value }))}
                  required
                  placeholder="e.g. Robert Johnson"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Doctor (Roster Dropdown)</label>
                <select
                  value={newOpForm.doctor_id}
                  onChange={(e) => handleDoctorSelectChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} [{doc.status.replace('_', ' ')}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Surgical Procedure</label>
                <input
                  type="text"
                  value={newOpForm.procedure_name}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, procedure_name: e.target.value }))}
                  required
                  placeholder="e.g. Coronary Artery Bypass Graft (CABG)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Operating Theatre</label>
                <select
                  value={newOpForm.operating_theater}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, operating_theater: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  <option value="OT #1">OT #1 (Cardiac)</option>
                  <option value="OT #2">OT #2 (General)</option>
                  <option value="OT #3">OT #3 (Neuro)</option>
                  <option value="OT #4">OT #4 (Ortho)</option>
                  <option value="OT #5">OT #5 (Emergency)</option>
                </select>
              </div>

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    value={newOpForm.scheduled_date}
                    onChange={(e) => setNewOpForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>Select Time</span>
                  </label>
                  <select
                    value={newOpForm.scheduled_time_slot}
                    onChange={(e) => setNewOpForm(prev => ({ ...prev, scheduled_time_slot: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOpModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOp}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
                >
                  {isSubmittingOp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Create & Notify Doctor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chatbot for Admin */}
      <AdminFloatingChatbot onDataRefresh={loadData} />
    </div>
  );
}
"""

import codecs
with codecs.open(TARGET, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done, lines:", content.count('\n'))
