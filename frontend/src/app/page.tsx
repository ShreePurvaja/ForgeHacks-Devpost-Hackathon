'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PortfolioHero from '@/components/PortfolioHero';
import PortfolioMetricsCharts from '@/components/PortfolioMetricsCharts';
import PortfolioArchitecture from '@/components/PortfolioArchitecture';
import { Stethoscope, Activity, TestTube, UserCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div 
      suppressHydrationWarning
      className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white"
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Portfolio Content */}
      <main 
        suppressHydrationWarning
        className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-16"
      >
        
        {/* 1. Hero Banner */}
        <PortfolioHero />

        {/* 2. Portfolio Impact Metrics & ROI Charts */}
        <PortfolioMetricsCharts />

        {/* 3. Architecture Blueprint Flow */}
        <PortfolioArchitecture />

        {/* 4. Dedicated Role Solutions Overview */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Role-Governed Ecosystem
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Enterprise Role Portals</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Each stakeholder accesses an isolated, role-specific dashboard via secure login
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Doctor */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between group hover:border-blue-300 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Doctor
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Doctor Cockpit</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Surgery Readiness Scorecard (0-100%) & Pre-Op Clearances.</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 group-hover:underline"
              >
                <span>Access Doctor Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Admin */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between group hover:border-blue-300 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Admin
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Command Center</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bottleneck Intelligence Tracer & Master Claims Hub.</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 group-hover:underline"
              >
                <span>Access Admin Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Lab Tech */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between group hover:border-blue-300 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <TestTube className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Lab Tech
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Diagnostic Hub</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Lab Work Orders & Real-time Event Sync.</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 group-hover:underline"
              >
                <span>Access Lab Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Patient */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between group hover:border-blue-300 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Patient
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Patient Care Hub</h3>
                  <p className="text-xs text-slate-500 mt-0.5">My Health Record & Voice Verification Agent.</p>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 group-hover:underline"
              >
                <span>Access Patient Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. CTA Banner */}
        <div className="rounded-3xl border border-blue-200 bg-blue-600 p-8 sm:p-12 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Sign In to Hospital-OS</h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">Select your role and authenticate into your isolated dashboard.</p>
          </div>

          <Link
            href="/login"
            className="rounded-2xl bg-white px-8 py-4 text-xs font-extrabold text-slate-900 shadow-lg transition hover:bg-slate-100 active:scale-95 shrink-0"
          >
            Access Login Gateway →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>Hospital Agentic Operating System (Hospital-OS) • Healthtech Portfolio • HL7 FHIR Engine</p>
      </footer>
    </div>
  );
}
