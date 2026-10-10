'use client';

import React from 'react';
import { FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '@/lib/api';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Claims',
      value: stats?.total_claims ?? 0,
      icon: FileText,
      accentColor: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'Approved Claims',
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      accentColor: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Rejected Claims',
      value: stats?.rejected ?? 0,
      icon: XCircle,
      accentColor: 'from-rose-500 to-red-500',
      borderColor: 'border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
    },
    {
      title: 'Open Escalation Tickets',
      value: stats?.open_tickets ?? 0,
      icon: AlertTriangle,
      accentColor: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/50`}
          >
            {/* Top gradient glow line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accentColor}`} />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  {isLoading ? (
                    <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-800" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} shadow-inner`}>
                <IconComponent className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
