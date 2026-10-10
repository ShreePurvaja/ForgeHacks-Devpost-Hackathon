'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Activity, Cpu } from 'lucide-react';

export default function PortfolioHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-14 shadow-lg shadow-slate-200/40">
      <div className="relative z-10 max-w-4xl space-y-6">
        
        {/* Startup Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-800">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          <span>Enterprise Healthcare Operating System</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Autonomous Coordination <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            For Modern Hospitals
          </span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl leading-relaxed font-normal">
          An event-driven neural layer over HL7 FHIR that coordinates specialized micro-agents across 
          surgeries, diagnostics, bottleneck intelligence, and billing with strict NIST policy governance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link
            href="/login"
            className="flex items-center gap-2.5 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95"
          >
            <span>Access Role Portals</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Value Bullet Points */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>HL7 FHIR R4 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>Event-Driven Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600" />
            <span>NIST AI RMF Governed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
