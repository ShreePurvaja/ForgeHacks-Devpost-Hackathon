'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, Activity, TestTube, UserCheck, 
  ArrowRight, Cpu, ChevronLeft
} from 'lucide-react';

export default function LoginPage() {
  const roles = [
    {
      id: 'doctor',
      name: 'Doctor Portal',
      subtitle: 'Clinical Pre-Op & Clearance Cockpit',
      desc: 'View live Surgery Readiness Scorecards, verify pre-op lab & imaging checkpoints, and grant clinical clearance.',
      icon: Stethoscope,
      badge: 'Doctor Role',
      href: '/doctor'
    },
    {
      id: 'admin',
      name: 'Hospital Command Center',
      subtitle: 'Operations, Bottlenecks & Claims Hub',
      desc: 'Query bottleneck intelligence ("Why is patient waiting?"), monitor Event Bus, and manage Claims Engine.',
      icon: Activity,
      badge: 'Admin Role',
      href: '/admin'
    },
    {
      id: 'lab',
      name: 'Diagnostic & Lab Workspace',
      subtitle: 'Pre-Op Lab Work Orders & Real-time Event Sync',
      desc: 'Review pending diagnostic orders, submit test results, and emit live events to Doctor Scorecards.',
      icon: TestTube,
      badge: 'Lab Tech Role',
      href: '/lab'
    },
    {
      id: 'patient',
      name: 'Patient Health Portal',
      subtitle: 'Personal Care Plan & Voice Call Verification',
      desc: 'Track claim status, review coverage findings, and launch Voice Agent 5B call overlay for self-corrections.',
      icon: UserCheck,
      badge: 'Patient Role',
      href: '/patient'
    }
  ];

  return (
    <div 
      suppressHydrationWarning
      className="min-h-screen bg-[#FAFBFD] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white flex flex-col justify-between p-4 sm:p-8"
    >
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 transition bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Portfolio Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-widest font-mono">
          <Cpu className="h-4 w-4 text-zinc-900" />
          <span>Hospital-OS Portal Gateway</span>
        </div>
      </div>

      {/* Main Login Role Cards Grid */}
      <div className="max-w-5xl mx-auto w-full my-12 space-y-8 animate-slide-up">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-800 bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">
            SELECT ROLE PORTAL
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">Sign In to Hospital-OS</h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal">
            Select your role to launch your dedicated full-screen dashboard portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className="rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-xs hover:border-zinc-900 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">{r.name}</h2>
                    <p className="text-xs font-semibold text-zinc-600 mt-0.5">{r.subtitle}</p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed font-normal">{r.desc}</p>
                  </div>
                </div>

                <Link
                  href={r.href}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 px-5 py-3.5 text-xs font-bold text-white shadow-md transition active:scale-95"
                >
                  <span>Launch {r.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-zinc-500 font-mono uppercase tracking-widest">
        <p>NIST AI RMF Compliant Governance • HL7 FHIR AuditEvent Logging Active</p>
      </footer>
    </div>
  );
}
