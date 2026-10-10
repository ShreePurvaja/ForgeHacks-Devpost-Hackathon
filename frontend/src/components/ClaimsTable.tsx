'use client';

import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { Claim } from '@/lib/api';

interface ClaimsTableProps {
  claims: Claim[];
  isLoading: boolean;
}

export default function ClaimsTable({ claims, isLoading }: ClaimsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = claims.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.patient_id && c.patient_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.procedure_code && c.procedure_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.decision && c.decision.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDecisionBadge = (decision?: string) => {
    switch (decision?.toUpperCase()) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> {decision || 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Healthcare Claims Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status of validated claims</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim, code, patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 left-9 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Claim ID</th>
              <th className="px-5 py-3.5">Patient ID</th>
              <th className="px-5 py-3.5">CPT Code</th>
              <th className="px-5 py-3.5">Decision</th>
              <th className="px-5 py-3.5">Confidence</th>
              <th className="px-5 py-3.5">Date Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                  <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                </tr>
              ))
            ) : filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  No claims found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4 font-mono font-medium text-slate-200">{claim.id}</td>
                  <td className="px-5 py-4 text-slate-300">{claim.patient_id || 'N/A'}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{claim.procedure_code || 'N/A'}</td>
                  <td className="px-5 py-4">{getDecisionBadge(claim.decision)}</td>
                  <td className="px-5 py-4 text-slate-400 font-medium">
                    {claim.confidence ? `${(Number(claim.confidence) * 100).toFixed(0)}%` : 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
