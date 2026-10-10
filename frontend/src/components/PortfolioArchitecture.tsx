'use client';

import React from 'react';
import { Database, GitMerge, ShieldCheck, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PortfolioArchitecture() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Architecture Blueprint
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900">System Pipeline Overview</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Decoupled pub/sub event pipeline over HL7 FHIR with NIST AI RMF governance
        </p>
      </div>

      {/* Node Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Node 1 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2 relative group hover:bg-white hover:border-blue-300 hover:shadow-xs transition">
          <div className="mx-auto h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-extrabold text-slate-900">1. Data Sensors</h3>
          <p className="text-[11px] text-slate-500">EHR, PACS, LIS & Telephony</p>
        </div>

        <div className="hidden md:flex justify-center text-slate-300">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 2 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2 relative group hover:bg-white hover:border-blue-300 hover:shadow-xs transition">
          <div className="mx-auto h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <GitMerge className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-extrabold text-slate-900">2. Event Bus</h3>
          <p className="text-[11px] text-slate-500">State transitions & pub/sub</p>
        </div>

        <div className="hidden md:flex justify-center text-slate-300">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Node 3 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2 relative group hover:bg-white hover:border-blue-300 hover:shadow-xs transition">
          <div className="mx-auto h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-xs font-extrabold text-slate-900">3. Agent Swarm</h3>
          <p className="text-[11px] text-slate-500">Groq GPT-OSS-120B reasoning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">NIST AI RMF Safety & Governance</h4>
            <p className="text-xs text-slate-500 mt-1">
              Every agent execution passes through permission matrix checks. High-risk actions require explicit clinician clearance.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">HL7 FHIR AuditEvent Logging</h4>
            <p className="text-xs text-slate-500 mt-1">
              All agent decisions, prompt reasoning chains, and patient voice interactions write immutable FHIR AuditEvent records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
