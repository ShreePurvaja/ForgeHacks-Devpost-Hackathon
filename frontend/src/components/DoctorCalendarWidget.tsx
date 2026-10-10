'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Check, FileText, User, Sparkles, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Surgery, bookSurgeryApi } from '@/lib/api';
import { useDemoEngine } from '@/lib/demoEngine';

interface CustomBlock {
  dayIdx: number;
  title: string;
  time: string;
  type: string;
}

interface DoctorCalendarWidgetProps {
  surgeries: Surgery[];
  doctorScheduleText?: string;
  onRefreshSchedule?: () => void;
}

export default function DoctorCalendarWidget({ surgeries, doctorScheduleText, onRefreshSchedule }: DoctorCalendarWidgetProps) {
  const days = ['Mon (Aug 18)', 'Tue (Aug 19)', 'Wed (Aug 20)', 'Thu (Aug 21)', 'Fri (Aug 22)', 'Sat (Aug 23)'];
  
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([
    { dayIdx: 4, title: 'Free Block Marked', time: '10:00 AM - 02:00 PM', type: 'FREE' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(2);
  const [blockTitle, setBlockTitle] = useState('Personal Leave / OPD Clinic');
  const [blockTime, setBlockTime] = useState('02:00 PM - 05:00 PM');
  const [blockType, setBlockType] = useState('PERSONAL');

  // Inspection Dialog Box Modal State for Selected Appointment
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);

  // Demo Engine Integration for Step 3 (Doctor Calendar Modal Inspection)
  const demo = useDemoEngine();

  useEffect(() => {
    if (demo.isActive && demo.demoMode === 'PATIENT_DEMO' && demo.currentStepIndex === 2) {
      const aug23Surgery = surgeries.find(s => (s.scheduled_time || '').includes('Aug 23') || (s.scheduled_time || '').includes('23rd'));
      if (aug23Surgery) {
        setSelectedSurgery(aug23Surgery);
      } else {
        setSelectedSurgery({
          id: 'SURG_AUG23_DEMO',
          doctor_id: 'DOC001',
          doctor_name: 'Dr. Sarah Jenkins',
          patient_id: 'pat001',
          patient_name: 'Robert Johnson',
          procedure_name: 'Cardiology Consultation',
          operating_theater: 'OPD Clinic 3',
          scheduled_time: 'Aug 23 at 10:00 AM',
          duration_mins: 45,
          patient_notes: 'First Time Patient — Severe headache, sore throat, and vomiting sensation',
          is_first_time: 1,
          readiness_score: 95,
          status: 'SCHEDULED'
        });
      }
    }
  }, [demo.isActive, demo.demoMode, demo.currentStepIndex, surgeries]);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: CustomBlock = {
      dayIdx: Number(selectedDayIdx),
      title: blockTitle,
      time: blockTime,
      type: blockType
    };

    setCustomBlocks(prev => [...prev, newBlock]);
    setShowAddModal(false);

    // If it's a surgery slot, save to SQLite DB
    if (blockType === 'SURGERY') {
      try {
        await bookSurgeryApi({
          doctor_id: 'DOC001',
          doctor_name: 'Dr. Sarah Jenkins',
          patient_id: 'pat001',
          patient_name: 'Scheduled Patient',
          procedure_name: blockTitle,
          operating_theater: 'OT #1',
          scheduled_time: `${days[selectedDayIdx].split(' ')[0]} ${blockTime}`,
          readiness_score: 90
        });
        if (onRefreshSchedule) onRefreshSchedule();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to parse time in minutes from midnight for chronological sorting
  const parseTimeInMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3] ? match[3].toLowerCase() : '';
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper to match surgery to exact calendar day column and sort chronologically
  const getSurgeriesForDay = (dayIdx: number) => {
    const matched = surgeries.filter((s) => {
      const timeLower = (s.scheduled_time || '').toLowerCase();
      
      // Mon (Aug 18) - dayIdx 0
      if (dayIdx === 0) {
        return timeLower.includes('mon') || timeLower.includes('aug 18') || timeLower.includes('2026-08-18');
      }
      // Tue (Aug 19) - dayIdx 1
      if (dayIdx === 1) {
        return timeLower.includes('tue') || timeLower.includes('aug 19') || timeLower.includes('2026-08-19');
      }
      // Wed (Aug 20) - dayIdx 2 (Today)
      if (dayIdx === 2) {
        return timeLower.includes('today') || timeLower.includes('wed') || timeLower.includes('aug 20') || timeLower.includes('2026-08-20');
      }
      // Thu (Aug 21) - dayIdx 3 (Tomorrow)
      if (dayIdx === 3) {
        return timeLower.includes('tomorrow') || timeLower.includes('thu') || timeLower.includes('aug 21') || timeLower.includes('2026-08-21');
      }
      // Fri (Aug 22) - dayIdx 4
      if (dayIdx === 4) {
        return timeLower.includes('fri') || timeLower.includes('aug 22') || timeLower.includes('22nd') || timeLower.includes('2026-08-22');
      }
      // Sat (Aug 23) - dayIdx 5
      if (dayIdx === 5) {
        return timeLower.includes('sat') || timeLower.includes('aug 23') || timeLower.includes('2026-08-23');
      }
      return false;
    });

    // Sort chronologically by time
    return matched.sort((a, b) => parseTimeInMinutes(a.scheduled_time) - parseTimeInMinutes(b.scheduled_time));
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 text-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-zinc-800" />
            Interactive Operations & Personal Schedule Calendar
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-normal">Real-Time Patient Bookings, OT Allocations & Patient Records</p>
        </div>

        <div className="flex items-center gap-2">
          {doctorScheduleText && (
            <span className="text-xs font-semibold px-3 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
              {doctorScheduleText}
            </span>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Personal / Surgery Block</span>
          </button>
        </div>
      </div>

      {/* Weekly Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {days.map((day, idx) => {
          const isToday = idx === 2; // Wed Aug 20
          const daySurgeries = getSurgeriesForDay(idx);
          const dayBlocks = customBlocks.filter(b => b.dayIdx === idx);

          return (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 space-y-2.5 flex flex-col justify-between min-h-[200px] ${
                isToday ? 'border-zinc-900 bg-white ring-1 ring-zinc-900 shadow-xs' : 'border-zinc-200 bg-zinc-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
                  <span className="text-xs font-bold text-zinc-900">{day.split(' ')[0]}</span>
                  <span className="text-[10px] font-medium text-zinc-500">{day.split(' ')[1]}</span>
                </div>

                <div className="mt-2 space-y-2">
                  {/* Surgeries / Appointments */}
                  {daySurgeries.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSurgery(s)}
                      className="group rounded-lg bg-white border border-zinc-200 p-2.5 text-xs space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-zinc-900 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                          {s.operating_theater}
                        </span>
                        {(s.document_filename || s.document_summary) && (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-zinc-900 bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">
                            <FileText className="h-2.5 w-2.5" /> PDF
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-zinc-900 leading-tight group-hover:text-zinc-800">{s.procedure_name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Patient: {s.patient_name}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-100 pt-1">
                        <span>{s.scheduled_time}</span>
                        <span className="text-[9px] font-bold text-zinc-900 underline group-hover:no-underline">Open Summary →</span>
                      </div>
                    </div>
                  ))}

                  {/* Manually Added Custom Blocks */}
                  {dayBlocks.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className={`rounded-lg border p-2 text-xs space-y-0.5 ${
                        b.type === 'PERSONAL'
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-800'
                          : 'bg-zinc-900 border-zinc-900 text-white font-semibold'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{b.time}</span>
                      <p className="font-bold leading-tight">{b.title}</p>
                    </div>
                  ))}

                  {daySurgeries.length === 0 && dayBlocks.length === 0 && (
                    <p className="text-[11px] text-zinc-400 italic py-2">Available for booking</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDayIdx(idx);
                  setShowAddModal(true);
                }}
                className={`text-[10px] font-semibold py-1 px-2 rounded-md text-center transition ${
                  isToday ? 'bg-zinc-900 text-white' : 'bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300 hover:text-zinc-900'
                }`}
              >
                {isToday ? 'TODAY' : '+ Add Block'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Appointment Details & Uploaded PDF Summary Modal */}
      {selectedSurgery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-slide-up">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    {selectedSurgery.patient_name}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                      {selectedSurgery.patient_id || 'pat001'}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal">Appointment & Clinical Intake Record</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSurgery(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold px-3 py-1 rounded-md bg-zinc-900 text-white">
                {selectedSurgery.procedure_name}
              </span>
              <span className="font-semibold px-3 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                Location: {selectedSurgery.operating_theater}
              </span>
              <span className="font-semibold px-3 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                Time: {selectedSurgery.scheduled_time}
              </span>
            </div>

            {/* Patient Visit Description / Notes */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Patient Visit Description & Notes</h4>
              {selectedSurgery.is_first_time === 1 || selectedSurgery.patient_notes?.includes('First Time') ? (
                <div className="flex items-center gap-2 text-zinc-800 font-medium">
                  <span className="px-2 py-0.5 rounded bg-zinc-200 text-[10px] font-bold text-zinc-800">1ST TIME PATIENT</span>
                  <p>First-time visiting patient. No prior medical history or document submitted.</p>
                </div>
              ) : (
                <p className="text-zinc-700 font-medium leading-relaxed">
                  {selectedSurgery.patient_notes || 'Patient booked consultation visit via Patient Care Navigator.'}
                </p>
              )}
            </div>

            {/* Submitted Document & AI Summary Section */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Submitted Medical Document & AI Summary</h4>

              {selectedSurgery.document_summary || selectedSurgery.document_filename ? (
                <div className="rounded-xl border border-zinc-300 bg-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-zinc-900">
                      <FileText className="h-4 w-4 text-zinc-800" />
                      <span>{selectedSurgery.document_filename || 'Patient_Medical_Report.pdf'}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      ATTACHED PDF / REPORT
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">AI Extracted Summary</span>
                    <p className="text-zinc-800 font-medium leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-200/80">
                      {selectedSurgery.document_summary || 'Normal Sinus Rhythm on ECG. Hemodynamic vitals verified. Pre-Op Troponin < 0.01 ng/mL.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-600 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span>No PDF or test report submitted during chatbot booking (1st Time / Direct Intake).</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSurgery(null)}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Schedule Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 animate-slide-up">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Add Schedule / Personal Block</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Select Day</label>
                <select
                  value={selectedDayIdx}
                  onChange={(e) => setSelectedDayIdx(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-semibold text-zinc-900 focus:outline-none"
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Block Type</label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-semibold text-zinc-900 focus:outline-none"
                >
                  <option value="PERSONAL">Personal Leave / Private Usage</option>
                  <option value="FREE">Mark Schedule FREE</option>
                  <option value="SURGERY">Emergency Surgery Slot</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Title / Note</label>
                <input
                  type="text"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="e.g. Personal Leave, OPD Consultation"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-medium text-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Time Range</label>
                <input
                  type="text"
                  value={blockTime}
                  onChange={(e) => setBlockTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 02:00 PM"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-medium text-zinc-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-zinc-800"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Schedule Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
