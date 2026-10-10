'use client';

import React from 'react';
import { Heart, Activity, Thermometer, Wind, AlertTriangle, ShieldCheck, User } from 'lucide-react';

interface EhrVitalsWidgetProps {
  patientName?: string;
  mrn?: string;
  age?: number;
  bloodType?: string;
}

export default function EhrVitalsWidget({
  patientName = 'Robert Johnson',
  mrn = 'MRN-884920',
  age = 58,
  bloodType = 'O Positive (O+)'
}: EhrVitalsWidgetProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 text-zinc-900">
      {/* Patient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-zinc-900">{patientName}</h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                {mrn}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Age: {age} | Gender: Male | Blood Group: <strong className="text-zinc-900 font-semibold">{bloodType}</strong>
            </p>
          </div>
        </div>

        {/* Allergy Warning Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
            <AlertTriangle className="h-3.5 w-3.5 text-zinc-600" />
            Penicillin Allergy
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-700 border border-zinc-200">
            Type 2 Diabetes
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-zinc-50 text-zinc-700 border border-zinc-200">
            Hypertension
          </span>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Heart Rate */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Heart Rate</span>
            <Heart className="h-4 w-4 text-zinc-700" />
          </div>
          <p className="text-xl font-bold text-zinc-900">72 <span className="text-xs font-normal text-zinc-500">bpm</span></p>
          <span className="text-[10px] font-semibold text-zinc-700">Normal Sinus</span>
        </div>

        {/* Blood Pressure */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Blood Pressure</span>
            <Activity className="h-4 w-4 text-zinc-700" />
          </div>
          <p className="text-xl font-bold text-zinc-900">120/80 <span className="text-xs font-normal text-zinc-500">mmHg</span></p>
          <span className="text-[10px] font-semibold text-zinc-700">Optimal Range</span>
        </div>

        {/* SpO2 */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Oxygen (SpO2)</span>
            <ShieldCheck className="h-4 w-4 text-zinc-700" />
          </div>
          <p className="text-xl font-bold text-zinc-900">98%</p>
          <span className="text-[10px] font-semibold text-zinc-700">95-100% Target</span>
        </div>

        {/* Temperature */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Body Temp</span>
            <Thermometer className="h-4 w-4 text-zinc-700" />
          </div>
          <p className="text-xl font-bold text-zinc-900">37.0 <span className="text-xs font-normal text-zinc-500">°C</span></p>
          <span className="text-[10px] font-semibold text-zinc-700">Afebrile</span>
        </div>

        {/* Respiratory Rate */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Resp Rate</span>
            <Wind className="h-4 w-4 text-zinc-700" />
          </div>
          <p className="text-xl font-bold text-zinc-900">16 <span className="text-xs font-normal text-zinc-500">/min</span></p>
          <span className="text-[10px] font-semibold text-zinc-700">Normal</span>
        </div>
      </div>
    </div>
  );
}
