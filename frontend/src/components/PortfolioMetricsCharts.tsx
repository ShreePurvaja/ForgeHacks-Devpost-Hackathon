'use client';

import React from 'react';
import { Clock, TrendingDown, Zap, ShieldCheck } from 'lucide-react';

export default function PortfolioMetricsCharts() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Quantifiable Enterprise Metrics
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900">Proven Operational & Financial Impact</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Benchmark data comparing legacy hospital workflows vs. Hospital-OS multi-agent automation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Time Reduction Bar Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pre-Op Surgery Clearance Time</h3>
                  <p className="text-xs text-slate-500">Average delay per surgical procedure</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                -92% Delay Reduction
              </span>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-6 pt-6">
              {/* Legacy */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Legacy Hospital Systems</span>
                  <span className="text-slate-500">4.2 Hours (252 Mins)</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
                  <div className="h-full rounded-full bg-slate-400 w-full" />
                </div>
              </div>

              {/* Hospital-OS */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1 text-blue-700 font-extrabold">
                    <Zap className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
                    Hospital-OS Multi-Agent Engine
                  </span>
                  <span className="text-blue-700 font-extrabold">18 Minutes</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-blue-50 overflow-hidden border border-blue-200 p-0.5">
                  <div className="h-full rounded-full bg-blue-600 w-[7.1%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center justify-between">
            <span>Clinical Result: Automated 5-domain pre-op check resolves bottlenecks.</span>
            <span className="font-bold text-blue-700">Saved: 3.9 Hours / Patient</span>
          </div>
        </div>

        {/* 2. Claim Denial Reduction Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">First-Pass Claim Rejection Rate</h3>
                  <p className="text-xs text-slate-500">Payer claim denial percentage</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                89% Drop
              </span>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-6 pt-6">
              {/* Legacy */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Manual Billing & Coding</span>
                  <span className="text-slate-500">34.2% Rejection Rate</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
                  <div className="h-full rounded-full bg-slate-400 w-[34.2%]" />
                </div>
              </div>

              {/* Hospital-OS */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1 text-blue-700 font-extrabold">
                    <ShieldCheck className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
                    Agent 4 + Voice Verification
                  </span>
                  <span className="text-blue-700 font-extrabold">3.8% Rejection Rate</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-blue-50 overflow-hidden border border-blue-200 p-0.5">
                  <div className="h-full rounded-full bg-blue-600 w-[3.8%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center justify-between">
            <span>Financial ROI: Automated patient voice call resolves billing details.</span>
            <span className="font-bold text-blue-700">Saved: $1.2M / Year</span>
          </div>
        </div>
      </div>
    </div>
  );
}
