'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Search, Database, ShieldCheck, Send, PhoneCall, Terminal, CheckCircle2, AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { WorkflowMessage } from '@/lib/api';
import { renderMarkdown } from '@/lib/renderMarkdown';

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
  const lastSpokenRef = useRef<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const cleanSpeechText = (raw: string): string => {
    return raw
      .replace(/^.*?Speaking:\s*"?/i, '')
      .replace(/["…]+$/g, '')
      .replace(/[*_#`~]+/g, '')
      // Remove emoji characters that interfere with speech synthesis engines
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();
  };

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleanText = cleanSpeechText(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance; // Prevent garbage collection in Chromium
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => {
        setIsPlayingVoice(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsPlayingVoice(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
      setIsPlayingVoice(false);
    }
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Auto-detect Agent 5B voice outreach message in the message trace
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && messages.length > 0) {
      const speechMsg = [...messages].reverse().find(
        (m) =>
          (m.agent?.toLowerCase().includes('5b') || m.status === 'speaking') &&
          (m.message?.toLowerCase().includes('speaking:') || m.status === 'speaking')
      );

      if (speechMsg && speechMsg.message && speechMsg.message !== lastSpokenRef.current) {
        lastSpokenRef.current = speechMsg.message;
        const timer = setTimeout(() => {
          speakText(speechMsg.message);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, speakText]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

        {/* Agent 5B Voice Outreach Callout Widget */}
        {(() => {
          const latestVoiceMsg = messages
            .slice()
            .reverse()
            .find(
              (m) =>
                (m.agent?.toLowerCase().includes('5b') || m.status === 'speaking') &&
                (m.message?.toLowerCase().includes('speaking:') ||
                  m.message?.toLowerCase().includes('calling patient') ||
                  m.status === 'speaking')
            );

          if (!latestVoiceMsg) return null;

          const displayText = cleanSpeechText(latestVoiceMsg.message);

          return (
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 to-slate-900/90 p-4 mb-6 shadow-xl shadow-rose-950/40 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <PhoneCall className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-300">Agent 5B Voice Telephony Call</span>
                      <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                    </div>
                    <p className="text-[11px] text-slate-200 mt-1 italic">
                      "{displayText || 'Agent 5B is conducting live patient call verification.'}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(latestVoiceMsg.message)}
                  className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-3.5 py-2 text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                  {isPlayingVoice ? 'Speaking Now...' : '🔊 Hear Agent Voice'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Streaming Log Terminal */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Real-time Execution Logs
            </span>
            <span className="text-[10px] text-slate-500">{messages.length} messages</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-2">
            {messages.length === 0 ? (
              <p className="text-slate-600 text-[11px] italic">Waiting for agent events...</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-slate-600 shrink-0 font-mono">
                    [{new Date(msg.ts).toLocaleTimeString()}]
                  </span>
                  <span className={`font-bold shrink-0 ${getLogAgentColor(msg.agent)}`}>
                    {msg.agent}:
                  </span>
                  <div className="text-slate-300 break-words flex-1 leading-normal font-sans text-xs">
                    {renderMarkdown(msg.message)}
                  </div>
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
