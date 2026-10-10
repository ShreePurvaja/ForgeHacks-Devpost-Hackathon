'use client';

import React from 'react';
import { 
  Activity, ShieldCheck, Stethoscope, Users, TestTube, UserCheck, 
  ArrowRight, Zap, Database, GitMerge, Cpu, Sparkles, CheckCircle2, Lock
} from 'lucide-react';

interface LandingHeroProps {
  onEnterSystem: (initialRole?: 'DOCTOR' | 'ADMIN' | 'LAB_TECH' | 'PATIENT') => void;
  onOpenClaimsAgent: () => void;
}

export default function LandingHero({ onEnterSystem, onOpenClaimsAgent }: LandingHeroProps) {
  return (
    <div className="space-y-12 pb-12 animate-slide-up">
      {/* ── Main Hero Banner ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-8 sm:p-12 shadow-xl shadow-slate-200/50">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
            <span>HL7 FHIR Event-Driven Agentic Operating Layer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Hospital Agentic <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Operating System (Hospital-OS)
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            An autonomous agent swarm sitting above legacy hospital infrastructure. Coordinates 
            surgery readiness, bottleneck intelligence, diagnostic lab events, and self-healing 
            claims with strict NIST policy governance and human oversight.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onEnterSystem('DOCTOR')}
              className="flex items-center gap-2.5 rounded-2xl bg-teal-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 hover:shadow-teal-600/35 active:scale-95"
            >
              <span>Enter Hospital OS</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onOpenClaimsAgent}
              className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 hover:border-blue-300 active:scale-95"
            >
              <Zap className="h-4 w-4 text-blue-600 fill-blue-600/20" />
              <span>⚡ Run Claims Agent</span>
            </button>
          </div>
        </div>

        {/* Floating Background Infographic Graphic */}
        <div className="absolute -right-12 -bottom-12 hidden lg:block opacity-15 pointer-events-none">
          <Activity className="h-96 w-96 text-teal-900" />
        </div>
      </div>

      {/* ── Infographic Architecture Diagram ──────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-slate-900">The 8-Step Closed-Loop Architecture</h2>
          <p className="text-xs text-slate-500 mt-1">Autonomous micro-agents running on HL7 FHIR + Event Bus</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Sense', desc: 'Event Bus captures hospital state transitions.', icon: Activity, color: 'text-teal-600 bg-teal-50 border-teal-200' },
            { step: '02', title: 'Understand', desc: 'LLM reasons over HL7 FHIR patient history.', icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { step: '03', title: 'Plan', desc: 'Multi-agent swarm drafts clinical readiness.', icon: GitMerge, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { step: '04', title: 'Coordinate', desc: 'Orchestrates Surgery, Lab, & Billing in parallel.', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { step: '05', title: 'Act', desc: 'Updates diagnostic DB & policy vectors.', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { step: '06', title: 'Verify', desc: 'Closed-loop check comparing expected vs actual.', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { step: '07', title: 'Escalate', desc: 'Human Command Center approval gate for high risk.', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
            { step: '08', title: 'Learn', desc: 'FHIR AuditEvent provenance logged to SQLite.', icon: Database, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 relative group hover:bg-white hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2.5 rounded-xl border ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">STEP {item.step}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 Visual Role Infographics ────────────────────────────────────── */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Choose Your Role Portal</h2>
            <p className="text-xs text-slate-500">Explore real-time data sync across all 4 hospital perspectives</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <Lock className="h-3 w-3" /> NIST AI RMF Permission Governed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Doctor Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Doctor Portal
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Cockpit</h3>
                <p className="text-xs text-slate-500 mt-1">Clinical Clearance & Surgery Readiness</p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Surgery Readiness Scorecard (0-100%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Live Lab & Imaging pre-op checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>One-click surgery clearance approval</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEnterSystem('DOCTOR')}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-600 group-hover:bg-teal-600"
            >
              Enter Doctor Portal →
            </button>
          </div>

          {/* Admin Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Admin Command
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Hospital Command Center</h3>
                <p className="text-xs text-slate-500 mt-1">Operational Bottlenecks & Claims Hub</p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>"Why is patient waiting?" bottleneck tracer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Real-time Hospital Event Bus stream</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Claims Engine & Escalation Tickets</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEnterSystem('ADMIN')}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 group-hover:bg-blue-600"
            >
              Enter Admin Portal →
            </button>
          </div>

          {/* Lab Tech Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <TestTube className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Lab & Diagnostics
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Diagnostic Hub</h3>
                <p className="text-xs text-slate-500 mt-1">Lab Work Orders & Instant DB Sync</p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Pending Pre-Op lab orders list</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Submit ECG, Blood, & Imaging results</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Emits LAB_RESULT_READY to Doctor live</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEnterSystem('LAB_TECH')}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600 group-hover:bg-amber-600"
            >
              Enter Lab Portal →
            </button>
          </div>

          {/* Patient Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  Patient Portal
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Patient Care Hub</h3>
                <p className="text-xs text-slate-500 mt-1">My Claims & Interactive Voice Call</p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Personal claims status tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Voice Agent 5B call verification modal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Self-correct claim details interactively</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onEnterSystem('PATIENT')}
              className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 group-hover:bg-indigo-600"
            >
              Enter Patient Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
