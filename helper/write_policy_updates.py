TARGET = r"d:\Data Science\SIH\Datathon-CIT\frontend\src\components\PolicyUpdates.tsx"

content = """\
'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PolicyUpdate } from '@/lib/api';

interface PolicyUpdatesProps {
  policies: PolicyUpdate[];
}

export default function PolicyUpdates({ policies }: PolicyUpdatesProps) {
  // Show only the most recent 5 policy updates
  const recent = policies.slice(0, 5);

  const getImpactBadge = (impact: string) => {
    switch ((impact || '').toLowerCase()) {
      case 'high':
        return <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">High Impact</span>;
      case 'medium':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">Medium Impact</span>;
      default:
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">Low Impact</span>;
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Recent Policy Updates (Agent 2)
        </h3>
        {policies.length > 0 && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {policies.length} Total
          </span>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">No policy change events detected</p>
      ) : (
        <div className="space-y-2.5">
          {recent.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 hover:bg-white hover:border-slate-200 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-xs">{p.policy_code}</span>
                {getImpactBadge(p.impact || 'low')}
              </div>
              <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                {p.change_description}
              </p>
              <p className="text-[10px] text-slate-400 pt-0.5">
                Detected: {p.detected_at ? new Date(p.detected_at).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          ))}
          {policies.length > 5 && (
            <p className="text-[10px] text-slate-400 text-center pt-1">
              +{policies.length - 5} more policy updates not shown
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
