'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PatientLang, PATIENT_TRANSLATIONS } from '@/lib/i18n/patient_translations';

interface PatientCalendarWidgetProps {
  lang: PatientLang;
}

export default function PatientCalendarWidget({ lang }: PatientCalendarWidgetProps) {
  const t = PATIENT_TRANSLATIONS[lang] || PATIENT_TRANSLATIONS.en;

  const visits = [
    {
      id: 'v1',
      date: 'Aug 22, 2026',
      time: '10:30 AM',
      doctor: 'Dr. Sarah Jenkins',
      specialty: 'Heart Bypass Surgery Consultation (Pre-Op)',
      clinic: 'Cardiology OPD Clinic 3',
      prep: 'Fast 8 hours prior; bring past ECG records.',
      status: 'CONFIRMED'
    },
    {
      id: 'v2',
      date: 'Aug 25, 2026',
      time: '02:00 PM',
      doctor: 'Dr. Michael Chang',
      specialty: 'Pre-Op Cardiac CT Scan',
      clinic: 'Radiology Scan Room #2',
      prep: 'Arrive 15 mins early for IV contrast prep.',
      status: 'SCHEDULED'
    }
  ];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 text-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">{t.visitCalendarTitle}</h3>
            <p className="text-xs text-zinc-500 font-normal">{t.upcomingVisits}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200 uppercase tracking-wider">
          2 Confirmed Appointments
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visits.map((v) => (
          <div key={v.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 hover:bg-white hover:border-zinc-300 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-800 bg-white px-2.5 py-0.5 rounded border border-zinc-200">
                {v.status}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>{v.date} at {v.time}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span>{v.specialty}</span>
              </h4>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">{v.doctor}</p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{v.clinic}</span>
            </div>

            <div className="text-[11px] font-medium text-zinc-800 bg-white p-2.5 rounded-lg border border-zinc-200 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <span>Prep: {v.prep}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
