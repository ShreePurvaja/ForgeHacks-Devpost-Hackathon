'use client';

import React from 'react';
import { 
  LayoutDashboard, Activity, ShieldCheck, UploadCloud, Calendar, Cpu
} from 'lucide-react';

export type DoctorNavTab = 'OVERVIEW' | 'READINESS_AGENT' | 'CLEARANCE_AGENT' | 'DISPATCH_SCAN_AGENT' | 'CALENDAR';

interface DoctorSidebarNavProps {
  activeTab: DoctorNavTab;
  onSelectTab: (tab: DoctorNavTab) => void;
}

export default function DoctorSidebarNav({ activeTab, onSelectTab }: DoctorSidebarNavProps) {
  const navItems: { id: DoctorNavTab; label: string; sub: string; icon: any; isAgent?: boolean }[] = [
    {
      id: 'OVERVIEW',
      label: 'Dashboard Overview',
      sub: 'Main Vitals & Cases',
      icon: LayoutDashboard
    },
    {
      id: 'READINESS_AGENT',
      label: 'Readiness Agent',
      sub: '5-Domain Readiness Loop',
      icon: Activity,
      isAgent: true
    },
    {
      id: 'CLEARANCE_AGENT',
      label: 'Clearance Agent',
      sub: 'EHR & ASA Risk Assessor',
      icon: ShieldCheck,
      isAgent: true
    },
    {
      id: 'DISPATCH_SCAN_AGENT',
      label: 'Scan Dispatcher Agent',
      sub: 'FHIR ServiceRequest Dispatch',
      icon: UploadCloud,
      isAgent: true
    },
    {
      id: 'CALENDAR',
      label: 'Operations Calendar',
      sub: 'OT Slots & Schedules',
      icon: Calendar
    }
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-zinc-900" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">Doctor Agents</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Clinical Micro-Agent Navigation</p>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm font-bold'
                  : 'bg-zinc-50/70 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 font-medium border border-transparent hover:border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-600'}`} />
                <div>
                  <p className="text-xs">{item.label}</p>
                  <p className={`text-[10px] ${isActive ? 'text-zinc-300 font-normal' : 'text-zinc-500'}`}>{item.sub}</p>
                </div>
              </div>

              {item.isAgent && (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                  isActive ? 'bg-white text-zinc-900' : 'bg-zinc-200/60 text-zinc-700 border border-zinc-300/60'
                }`}>
                  Agent
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
