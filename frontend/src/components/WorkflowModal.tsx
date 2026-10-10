'use client';

import React, { useEffect, useRef } from 'react';
import { X, Search, Database, ShieldCheck, Send, PhoneCall, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WorkflowMessage } from '@/lib/api';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string | null;
  currentStep: string;
  status: string;
  messages: WorkflowMessage[];
}

export default function WorkflowModal({
  isOpen,
  onClose,
  claimId,
  currentStep,
  status,
  messages,
}: WorkflowModalProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Nodes definition
  const nodes = [
    { id: 'Agent 2', title: 'Agent 2', desc: 'Policy Detector', icon: Search },
    { id: 'Agent 3', title: 'Agent 3', desc: 'FHIR Updater', icon: Database },
    { id: 'Agent 4', title: 'Agent 4', desc: 'Claim Validator', icon: ShieldCheck },
    { id: 'Agent 5A', title: 'Agent 5A', desc: 'Approval Router', icon: Send },
    { id: 'Agent 5B', title: 'Agent 5B', desc: 'Voice Agent', icon: PhoneCall },
  ];

  // Helper to determine node state
  const getNodeState = (nodeId: string) => {
    const isCurrent = currentStep.toLowerCase().includes(nodeId.toLowerCase().replace(' ', ''));
    const messageAgents = messages.map((m) => m.agent.toLowerCase());
    const hasExecuted = messageAgents.some((a) => a.includes(nodeId.toLowerCase().replace(' ', '')));

    if (isCurrent) return 'active';
    if (hasExecuted && !isCurrent) return 'complete';
    if (status === 'error' && isCurrent) return 'error';
    return 'pending';
  };

  // Progress percentage calculation
  const completedCount = nodes.filter((n) => getNodeState(n.id) === 'complete').length;
  const progressPercent = Math.min(100, Math.max(10, (completedCount / nodes.length) * 100));

  // Color mappings for terminal log agents
  const getLogAgentColor = (agentName: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('agent2')) return 'text-blue-400';
    if (name.includes('agent3')) return 'text-emerald-400';
    if (name.includes('agent4')) return 'text-amber-400';
    if (name.includes('agent5a')) return 'text-orange-400';
    if (name.includes('agent5b')) return 'text-rose-400';
    if (name.includes('patient')) return 'text-green-400';
    return 'text-purple-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md animate-slide-up">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-blue-500/10 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              LangGraph Multi-Agent Workflow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Claim ID: <span className="font-mono text-slate-200">{claimId || 'Processing...'}</span></p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-800/50 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 mb-8">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Agent Node Pipeline */}
        <div className="relative mb-8 grid grid-cols-5 gap-2 sm:gap-4">
          {/* Connector line */}
          <div className="absolute top-7 left-[10%] right-[10%] h-1 bg-slate-800 -z-0" />

          {nodes.map((node) => {
            const state = getNodeState(node.id);
            const Icon = node.icon;

            return (
              <div key={node.id} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 shadow-lg ${
                    state === 'active'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 animate-pulse-glow scale-110'
                      : state === 'complete'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : state === 'error'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-2.5 text-xs font-bold text-slate-200">{node.title}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{node.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Live Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {currentStep || 'Initializing execution pipeline...'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {status === 'completed'
                  ? 'Workflow completed successfully.'
                  : status === 'error'
                  ? 'An error occurred during workflow execution.'
                  : 'Multi-agent orchestration in progress...'}
              </p>
            </div>
          </div>
        </div>

        {/* Streaming Log Terminal */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Real-time Execution Logs
            </span>
            <span className="text-[10px] text-slate-500">{messages.length} messages</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-2">
            {messages.length === 0 ? (
              <p className="text-slate-600 text-[11px] italic">Waiting for agent events...</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-slate-600 shrink-0">
                    [{new Date(msg.ts).toLocaleTimeString()}]
                  </span>
                  <span className={`font-bold shrink-0 ${getLogAgentColor(msg.agent)}`}>
                    {msg.agent}:
                  </span>
                  <span className="text-slate-300 break-all">{msg.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
