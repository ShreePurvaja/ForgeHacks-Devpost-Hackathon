'use client';

import React, { useState } from 'react';
import { ShieldCheck, Stethoscope, AlertTriangle, Check, X } from 'lucide-react';

interface AnesthesiaRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  onCompleteAssessment?: (asaClass: string) => void;
}

export default function AnesthesiaRiskModal({
  isOpen,
  onClose,
  patientName = 'Robert Johnson',
  onCompleteAssessment
}: AnesthesiaRiskModalProps) {
  const [asaClass, setAsaClass] = useState('ASA_II');
  const [mallampati, setMallampati] = useState('Class II');
  const [cardiacRisk, setCardiacRisk] = useState('Low Risk (< 0.9%)');
  const [notes, setNotes] = useState('Pre-op ECG verified. Patient cleared for IV anesthesia induction.');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    if (onCompleteAssessment) onCompleteAssessment(asaClass);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 animate-slide-up">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-7 shadow-2xl space-y-6 text-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Anesthesia & Surgical Risk Assessment</h3>
              <p className="text-xs text-zinc-500 font-normal">Patient: {patientName} (CABG Surgery)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {saved && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-3.5 text-xs font-semibold text-zinc-900 flex items-center gap-2">
            <Check className="h-4 w-4 text-zinc-900" />
            <span>Risk assessment saved & linked to HL7 FHIR Procedure record!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              ASA Physical Status Classification
            </label>
            <select
              value={asaClass}
              onChange={(e) => setAsaClass(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <option value="ASA_I">ASA Class I — Normal Healthy Patient</option>
              <option value="ASA_II">ASA Class II — Patient with Mild Systemic Disease (Controlled HTN/Diabetes)</option>
              <option value="ASA_III">ASA Class III — Patient with Severe Systemic Disease</option>
              <option value="ASA_IV">ASA Class IV — Patient with Severe Disease Threatening Life</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Mallampati Airway Score</label>
              <select
                value={mallampati}
                onChange={(e) => setMallampati(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <option value="Class I">Class I — Full Visibility</option>
                <option value="Class II">Class II — Partial Visibility</option>
                <option value="Class III">Class III — Soft Palate Only</option>
                <option value="Class IV">Class IV — Hard Palate Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Cardiac Risk Index</label>
              <select
                value={cardiacRisk}
                onChange={(e) => setCardiacRisk(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <option value="Low Risk (< 0.9%)">Low Risk (&lt; 0.9% Complications)</option>
                <option value="Moderate Risk (1.3%)">Moderate Risk (1.3%)</option>
                <option value="High Risk (> 6%)">High Risk (&gt; 6.0%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Anesthesiologist Clinical Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-normal text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-zinc-800 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Save & Clear Risk Assessment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
