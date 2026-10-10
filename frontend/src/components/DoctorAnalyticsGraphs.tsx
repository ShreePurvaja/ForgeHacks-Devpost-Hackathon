'use client';

import React from 'react';
import { TrendingUp, CheckCircle2, Award, Clock } from 'lucide-react';

export default function DoctorAnalyticsGraphs() {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const casesData = [14, 18, 22, 19, 25, 28]; // Monthly surgical cases

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-zinc-900">
      
      {/* 1. Monthly Surgical Cases Completed Bar Graph */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-800" />
              Surgical Operations Completed
            </h3>
            <p className="text-xs text-zinc-500 font-normal">Monthly cases executed by Dr. Sarah Jenkins</p>
          </div>
          <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200">
            28 Cases (Aug)
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 flex items-end justify-between gap-2 h-40">
          {casesData.map((val, idx) => {
            const heightPercent = (val / 30) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-zinc-700">{val}</span>
                <div className="w-full bg-zinc-100 rounded-lg overflow-hidden p-0.5 border border-zinc-200/60 h-full flex items-end">
                  <div
                    className="w-full rounded-md bg-zinc-900 transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-zinc-500">{months[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Readiness Pass Rate & Turnaround */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-zinc-800" />
              Surgery Clearance Pass Rate
            </h3>
            <p className="text-xs text-zinc-500 font-normal">Pre-op domain readiness compliance</p>
          </div>
          <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200">
            96.4% Compliance
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
              <span>First-Pass Readiness Rate</span>
              <span className="text-zinc-900 font-bold">96.4%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-900 w-[96.4%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
              <span>Anesthesia Risk Clearance</span>
              <span className="text-zinc-900 font-bold">98.1%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-900 w-[98.1%]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-zinc-600" />
            <span>Avg Surgical Turnaround: 18 Mins</span>
          </div>
          <span className="font-semibold text-zinc-900">NIST Audit Verified</span>
        </div>
      </div>
    </div>
  );
}
