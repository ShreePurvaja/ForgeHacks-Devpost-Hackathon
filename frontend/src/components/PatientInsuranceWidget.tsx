'use client';

import React from 'react';
import { ShieldCheck, TrendingUp, CheckCircle2, AlertCircle, Sparkles, Award } from 'lucide-react';
import { PatientLang, PATIENT_TRANSLATIONS } from '@/lib/i18n/patient_translations';

interface PatientInsuranceWidgetProps {
  lang: PatientLang;
  activePolicy: string;
  policyLimit: number;
  deductibleUsed: number;
  cashThreshold: number;
}

export default function PatientInsuranceWidget({
  lang,
  activePolicy,
  policyLimit,
  deductibleUsed,
  cashThreshold
}: PatientInsuranceWidgetProps) {
  const t = PATIENT_TRANSLATIONS[lang] || PATIENT_TRANSLATIONS.en;

  const percentUsed = Math.min(100, Math.round((deductibleUsed / policyLimit) * 100));

  const comparisonSchemes = [
    {
      name: 'Star Health Gold PPO (Current)',
      type: 'Private Individual',
      cover: '₹5,00,000 / year',
      copay: '0%',
      roomRentCap: 'No Cap (Private Room)',
      preAuthReq: 'Only for Surgeries > ₹1,00,000',
      status: 'ACTIVE',
      color: 'blue'
    },
    {
      name: 'Ayushman Bharat PM-JAY',
      type: 'Government Scheme',
      cover: '₹5,00,000 / family / year',
      copay: '0% (Cashless)',
      roomRentCap: 'General Ward Standard',
      preAuthReq: 'Required for all secondary & tertiary packages',
      status: 'RECOMMENDED_GOVT',
      color: 'emerald'
    },
    {
      name: 'Corporate Group PPO (HDFC Ergo)',
      type: 'Employer Scheme',
      cover: '₹7,50,000 / year',
      copay: '10%',
      roomRentCap: 'Single Private Room',
      preAuthReq: 'Instant Digital Auto-Clearance',
      status: 'RECOMMENDED_PRIVATE',
      color: 'purple'
    }
  ];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">{t.insuranceComparisonTitle}</h3>
            <p className="text-xs text-zinc-500 font-normal">{t.insuranceComparisonSub}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-zinc-500">{t.activePolicy}:</span>
          <span className="font-semibold text-zinc-800 bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">
            {activePolicy}
          </span>
        </div>
      </div>

      {/* Visual Deductible Usage Progress Bar */}
      <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-zinc-800">
            <TrendingUp className="h-4 w-4 text-zinc-600" />
            <span>Annual Insurance Policy Deductible Tracker</span>
          </div>
          <span className="font-bold text-zinc-900">
            ₹{deductibleUsed.toLocaleString('en-IN')} / ₹{policyLimit.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 transition-all duration-500 rounded-full"
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
          <span>₹{deductibleUsed.toLocaleString('en-IN')} Used (3%)</span>
          <span className="text-zinc-800 font-semibold">₹{(policyLimit - deductibleUsed).toLocaleString('en-IN')} Available Coverage</span>
        </div>
      </div>

      {/* Side-by-Side Scheme Comparison Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-zinc-600" />
          <span>{t.betterSchemesTitle}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisonSchemes.map((scheme, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 space-y-3 transition ${
                scheme.status === 'ACTIVE'
                  ? 'border-zinc-300 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-200 bg-zinc-100 text-zinc-700">
                  {scheme.type}
                </span>
                {scheme.status === 'ACTIVE' && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-800">
                    <CheckCircle2 className="h-3 w-3 text-zinc-700" /> Active Scheme
                  </span>
                )}
              </div>

              <div>
                <h5 className="text-xs font-bold text-zinc-900">{scheme.name}</h5>
                <p className="text-sm font-bold text-zinc-900 mt-1">{scheme.cover}</p>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-600 border-t border-zinc-200/80 pt-2.5">
                <div className="flex justify-between">
                  <span>Co-Pay:</span>
                  <span className="font-semibold text-zinc-900">{scheme.copay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Category:</span>
                  <span className="font-semibold text-zinc-900">{scheme.roomRentCap}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pre-Auth Rule:</span>
                  <span className="font-normal text-zinc-700">{scheme.preAuthReq}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
