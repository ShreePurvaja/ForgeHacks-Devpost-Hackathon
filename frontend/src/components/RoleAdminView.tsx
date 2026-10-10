'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Zap, RefreshCw, Radio, Stethoscope, Bell, Check, X,
  PlusCircle, Bed, ShieldCheck, Cpu, Calendar, Clock, ChevronRight, Users
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
import AdminPatientManagementView from './AdminPatientManagementView';
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

  // Main view navigation tab (Dashboard vs Patient Directory vs Admin Agents)
  const [activeMainTab, setActiveMainTab] = useState<'DASHBOARD' | 'PATIENTS' | 'AGENTS'>('DASHBOARD');
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

  // Interactive OT Capacity & Operations Inspection Modal State
  const [showOtCapacityModal, setShowOtCapacityModal] = useState(false);

  return (
    <div className="space-y-8 animate-slide-up pb-24 relative">
      {/* Top Main Navigation Bar (Dashboard vs Patient Directory vs Admin Agents) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Hospital Operations Command Center</h2>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800 border border-zinc-200">
                ADMIN ROLE
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Live Capacity, Patient Intake Directory, Doctor Roster, OT Booking Approvals, & Admin Agents
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
          <button
            onClick={() => setActiveMainTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'DASHBOARD'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Command Dashboard</span>
          </button>

          <button
            onClick={() => setActiveMainTab('PATIENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'PATIENTS'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Patient Intake & Directory</span>
          </button>
          
          <button
            onClick={() => setActiveMainTab('AGENTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'AGENTS'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Admin Agents Flow</span>
          </button>

          <button
            onClick={() => setShowCreateOpModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4 text-white" />
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
      ) : activeMainTab === 'PATIENTS' ? (
        <AdminPatientManagementView />
      ) : (
        <div className="space-y-8">
          {/* Bed & OT Total Capacity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Beds */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs hover:border-zinc-400 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hospital Inpatient Beds</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
                  <Bed className="h-5 w-5" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900">{capacity.available_beds}</span>
                  <span className="text-xs font-bold text-zinc-400">/ {capacity.total_beds} Total</span>
                </div>
                <p className="text-xs font-semibold text-zinc-800 mt-0.5">Available Inpatient Beds</p>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                <div 
                  className="bg-zinc-900 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((capacity.occupied_beds / capacity.total_beds) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-500">
                <span>Occupied: <strong>{capacity.occupied_beds}</strong></span>
                <span>Available: <strong className="text-zinc-900 font-bold">{capacity.available_beds}</strong></span>
              </div>
            </div>

            {/* Total Operating Theatres (OT) - Interactive Clickable Card */}
            <div 
              onClick={() => setShowOtCapacityModal(true)}
              className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs hover:border-zinc-900 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Operating Theatres (OT)</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold group-hover:scale-105 transition">
                  <Stethoscope className="h-5 w-5" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900">{capacity.available_ots}</span>
                  <span className="text-xs font-bold text-zinc-400">/ {capacity.total_ots} Total</span>
                </div>
                <p className="text-xs font-semibold text-zinc-800 mt-0.5 flex items-center justify-between">
                  <span>Ready for Surgeries</span>
                  <span className="text-[10px] font-bold text-zinc-900 underline group-hover:no-underline">Inspect OTs →</span>
                </p>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                <div 
                  className="bg-zinc-900 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((capacity.in_use_ots / capacity.total_ots) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-500">
                <span>In Use: <strong>{capacity.in_use_ots}</strong></span>
                <span>Available: <strong className="text-zinc-900 font-bold">{capacity.available_ots}</strong></span>
              </div>
            </div>

            {/* Pending OT Booking Requests */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs hover:border-zinc-400 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">OT Booking Requests</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 font-bold relative border border-zinc-200">
                  <Bell className="h-5 w-5" />
                  {otRequests.length > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-zinc-900 animate-ping" />
                  )}
                </span>
              </div>
              <div>
                <span className="text-3xl font-black text-zinc-900">{otRequests.length}</span>
                <p className="text-xs font-semibold text-zinc-800 mt-0.5">Pending Admin Approval</p>
              </div>
              <div className="pt-1 text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-zinc-800" />
                <span>Doctor requests awaiting review</span>
              </div>
            </div>

            {/* Admin Agentic Control */}
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 shadow-xs hover:bg-zinc-100 transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">Agentic Operations</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold">
                  <Cpu className="h-5 w-5" />
                </span>
              </div>
              <div>
                <span className="text-sm font-black text-zinc-900">Groq LLM Active</span>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">Pre-Op Claims & Capacity Agent</p>
              </div>
              <button
                onClick={() => {
                  setActiveMainTab('AGENTS');
                  setSelectedAgentTab('OPERATION_CLAIMS_AGENT');
                }}
                className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition"
              >
                <span>Launch Admin Agents</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Notification Bar for Pending OT Booking Requests */}
          {otRequests.length > 0 && (
            <div className="rounded-3xl border border-zinc-900 bg-zinc-900 p-6 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 text-white">
                    <Bell className="h-5 w-5 animate-bounce" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      Doctor OT Booking Requests Notification Bar
                      <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-white border border-zinc-700">
                        {otRequests.length} Action Needed
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                      Doctors have requested Operating Theatre bookings. Review & click OK to approve and notify doctors instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                        {req.urgency}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">{req.id}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{req.procedure_name}</h4>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Patient: <strong>{req.patient_name}</strong> • Doctor: <strong>{req.doctor_name}</strong>
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span>Requested: <strong className="text-white">{req.ot_room}</strong></span>
                        <span>Time: <strong className="text-white">{req.scheduled_time}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOtDecision(req.id, 'REJECTED')}
                        disabled={decidingId === req.id}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition"
                      >
                        <X className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleOtDecision(req.id, 'APPROVED')}
                        disabled={decidingId === req.id}
                        className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-zinc-900 shadow-md hover:bg-zinc-100 transition active:scale-95"
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
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-zinc-800" />
                  Doctor Roster & Availability Status Board
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                  Live availability indicators: 🔴 Red = In Operation | 🟢 Green = Free / Available | 🟡 Yellow = Attending Regular Patients
                </p>
              </div>

              {/* Status Legend Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1.5 bg-zinc-900 text-white px-2.5 py-1 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  🔴 In Operation
                </span>
                <span className="flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200">
                  <span className="h-2 w-2 rounded-full bg-zinc-800" />
                  🟢 Free / Available
                </span>
                <span className="flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200">
                  <span className="h-2 w-2 rounded-full bg-zinc-500" />
                  🟡 Regular Patients
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctorsList.map((doc) => {
                let statusBadgeClass = "bg-zinc-100 text-zinc-700 border-zinc-200";
                let statusText = doc.status.replace('_', ' ');

                if (doc.status === 'IN_SURGERY' || doc.status === 'IN_OPERATION') {
                  statusBadgeClass = "bg-zinc-900 text-white font-black";
                  statusText = "🔴 IN OPERATION";
                } else if (doc.status === 'AVAILABLE') {
                  statusBadgeClass = "bg-zinc-100 text-zinc-900 border-zinc-300 font-extrabold";
                  statusText = "🟢 AVAILABLE (FREE)";
                } else if (doc.status === 'REGULAR_PATIENTS' || doc.status === 'ON_CALL') {
                  statusBadgeClass = "bg-zinc-100 text-zinc-800 border-zinc-200 font-bold";
                  statusText = "🟡 REGULAR PATIENTS";
                }

                return (
                  <div key={doc.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 hover:bg-white hover:border-zinc-900 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{doc.id}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md border ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{doc.name}</h4>
                      <p className="text-xs text-zinc-500 font-medium">{doc.specialty}</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Location:</span>
                      <span className="font-bold text-zinc-900">{doc.current_location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Rejected Claims — light white card, last 5 */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-zinc-800" />
                Recent Rejected Claims
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                {rejectedClaims.length} REJECTED
              </span>
            </div>

            {rejectedClaims.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">No rejected claims found.</p>
            ) : (
              <div className="space-y-2">
                {rejectedClaims.map((claim, idx) => (
                  <div key={claim.id || idx} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 hover:bg-white transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shrink-0 font-bold text-xs">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {claim.patient_name || claim.patient_id || 'Unknown Patient'}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {claim.description || claim.procedure_code || claim.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                        REJECTED
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono hidden sm:block">
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
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-zinc-800" />
                    Hospital Real-Time Event Bus Stream
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-zinc-900 animate-ping" />
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {eventsList.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No events published yet.</p>
                  ) : (
                    eventsList.slice(0, 10).map((evt) => (
                      <div key={evt.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{evt.event_type}</span>
                          <span className="text-[10px] text-zinc-500 font-medium">{evt.source_agent}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 font-mono truncate">{JSON.stringify(evt.payload)}</p>
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

      {/* Operating Theatres (OT) Live Status & Ongoing Operations Inspection Modal */}
      {showOtCapacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-slide-up">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-zinc-200 text-zinc-900 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold shadow-sm">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    Operating Theatres (OT) Live Allocation & Case Inspector
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                      8 TOTAL OTs
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal">Real-time status, assigned doctors, and ongoing surgical procedures</p>
                </div>
              </div>

              <button 
                onClick={() => setShowOtCapacityModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Counters Bar */}
            <div className="grid grid-cols-3 gap-3 text-xs text-center font-bold">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
                <span className="text-[10px] text-zinc-500 block">TOTAL OTs</span>
                <span className="text-lg text-zinc-900">8</span>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-900 text-white p-2.5">
                <span className="text-[10px] text-zinc-300 block">IN USE / OCCUPIED</span>
                <span className="text-lg">3</span>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-2.5">
                <span className="text-[10px] text-zinc-600 block">AVAILABLE / READY</span>
                <span className="text-lg text-zinc-900">4</span>
              </div>
            </div>

            {/* OTs Grid List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live OT Suites (1 to 8)</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* OT #1 */}
                <div className="rounded-2xl border border-zinc-300 bg-zinc-50/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #1 (Cardiac Suite)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold text-[10px]">
                      🔴 IN USE (ONGOING)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-700">
                    <p><strong>Doctor:</strong> Dr. Sarah Jenkins (Cardiothoracic Surgery)</p>
                    <p><strong>Active Case:</strong> Coronary Artery Bypass Graft (CABG)</p>
                    <p><strong>Patient:</strong> Robert Johnson (pat001)</p>
                    <p className="text-[10px] text-zinc-500">Scheduled: Today 10:30 AM (Est duration: 180 mins)</p>
                  </div>
                </div>

                {/* OT #2 */}
                <div className="rounded-2xl border border-zinc-300 bg-zinc-50/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #2 (Orthopedic Suite)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold text-[10px]">
                      🔴 IN USE (SCHEDULED)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-700">
                    <p><strong>Doctor:</strong> Dr. Michael Chang (Orthopedic Surgery)</p>
                    <p><strong>Active Case:</strong> Total Knee Arthroplasty</p>
                    <p><strong>Patient:</strong> Mary Smith (pat002)</p>
                    <p className="text-[10px] text-zinc-500">Scheduled: Today 02:00 PM (Est duration: 120 mins)</p>
                  </div>
                </div>

                {/* OT #3 */}
                <div className="rounded-2xl border border-zinc-300 bg-zinc-50/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #3 (General Surgery)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold text-[10px]">
                      🔴 IN USE (SCHEDULED)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-700">
                    <p><strong>Doctor:</strong> Dr. James Wilson (General Surgery)</p>
                    <p><strong>Active Case:</strong> Laparoscopic Cholecystectomy</p>
                    <p><strong>Patient:</strong> David Miller (pat003)</p>
                    <p className="text-[10px] text-zinc-500">Scheduled: Tomorrow 09:00 AM (Est duration: 90 mins)</p>
                  </div>
                </div>

                {/* OT #4 */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #4 (Neuro Suite)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-[10px]">
                      🟢 AVAILABLE (READY)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-600">
                    <p><strong>Doctor:</strong> Dr. Elena Rostova (Standby)</p>
                    <p className="text-[11px] text-zinc-500 italic">Sanitized & ready for immediate surgical booking.</p>
                  </div>
                </div>

                {/* OT #5 */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #5 (Trauma & ER)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-[10px]">
                      🟢 AVAILABLE (READY)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-600">
                    <p><strong>Doctor:</strong> Unassigned (Emergency Standby)</p>
                    <p className="text-[11px] text-zinc-500 italic">Reserved for Level 1-2 trauma admissions.</p>
                  </div>
                </div>

                {/* OT #6 */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-zinc-900 text-sm">OT #6 (Pediatric Suite)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold text-[10px]">
                      🟢 AVAILABLE (READY)
                    </span>
                  </div>
                  <div className="space-y-1 font-medium text-zinc-600">
                    <p><strong>Doctor:</strong> Available on-call</p>
                    <p className="text-[11px] text-zinc-500 italic">Cleared for booking.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setShowOtCapacityModal(false)}
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create Operation Modal with Date Picker & Doctor Selection Dropdown */}
      {showCreateOpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-zinc-200 text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold shadow-sm">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Create & Schedule Operation</h3>
                  <p className="text-xs text-zinc-500">Assign doctor, reserve OT, pick date, and notify doctor</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateOpModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOperationSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={newOpForm.patient_name}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, patient_name: e.target.value }))}
                  required
                  placeholder="e.g. Robert Johnson"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Select Doctor (Roster Dropdown)</label>
                <select
                  value={newOpForm.doctor_id}
                  onChange={(e) => handleDoctorSelectChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 font-bold cursor-pointer"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} [{doc.status.replace('_', ' ')}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Surgical Procedure</label>
                <input
                  type="text"
                  value={newOpForm.procedure_name}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, procedure_name: e.target.value }))}
                  required
                  placeholder="e.g. Coronary Artery Bypass Graft (CABG)"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1">Operating Theatre</label>
                <select
                  value={newOpForm.operating_theater}
                  onChange={(e) => setNewOpForm(prev => ({ ...prev, operating_theater: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 font-medium cursor-pointer"
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
                  <label className="block text-zinc-700 font-bold mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-800" />
                    <span>Select Date</span>
                  </label>
                  <input
                    type="date"
                    value={newOpForm.scheduled_date}
                    onChange={(e) => setNewOpForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-800" />
                    <span>Select Time</span>
                  </label>
                  <select
                    value={newOpForm.scheduled_time_slot}
                    onChange={(e) => setNewOpForm(prev => ({ ...prev, scheduled_time_slot: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-zinc-900 focus:bg-white font-medium cursor-pointer"
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

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOpModal(false)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOp}
                  className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition active:scale-95"
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
