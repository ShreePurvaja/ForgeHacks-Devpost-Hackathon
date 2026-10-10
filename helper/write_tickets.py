TARGET = r"d:\Data Science\SIH\Datathon-CIT\frontend\src\components\TicketsList.tsx"

content = """\
'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EscalationTicket } from '@/lib/api';

interface TicketsListProps {
  tickets: EscalationTicket[];
}

export default function TicketsList({ tickets }: TicketsListProps) {
  // Show only the most recent 5 tickets
  const recent = tickets.slice(0, 5);

  const priorityStyle = (priority: string) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'critical') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'high') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Human Escalation Tickets (Agent 5A)
        </h3>
        {tickets.length > 0 && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {tickets.length} Total
          </span>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">No open escalation tickets</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 hover:bg-white hover:border-slate-200 transition">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400 truncate">{t.id}</span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityStyle(t.priority || 'medium')}`}>
                  {t.priority || 'Medium'}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2">
                {t.issue}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Claim: <strong className="text-slate-600">{t.claim_id}</strong></span>
                <span>Patient: <strong className="text-slate-600">{t.patient_id}</strong></span>
              </div>
            </div>
          ))}
          {tickets.length > 5 && (
            <p className="text-[10px] text-slate-400 text-center pt-1">
              +{tickets.length - 5} more tickets not shown
            </p>
          )}
        </div>
      )}
    </div>
  );
}
"""

import codecs
with codecs.open(TARGET, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done, lines:", content.count('\n'))
