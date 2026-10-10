'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Play, Pause, Square, Clock, Zap, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { useDemoEngine, demoEngine, DemoMode } from '@/lib/demoEngine';

export default function DemoAgenticControlBar() {
  const router = useRouter();
  const pathname = usePathname();

  const { 
    isActive, demoMode, currentStepIndex, totalSteps, isPaused, remainingSeconds, currentStepInfo,
    isExecutingAction, executingStatusText, startDemo, stopDemo, pauseDemo, resumeDemo
  } = useDemoEngine();

  // Live countdown timer for all demo steps
  useEffect(() => {
    if (!isActive || isPaused || isExecutingAction) return;

    const interval = setInterval(() => {
      demoEngine.tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, isExecutingAction, currentStepIndex]);

  // Automatic role-based route navigation during demo
  useEffect(() => {
    if (!isActive || !currentStepInfo) return;
    const target = currentStepInfo.targetRole;
    if (target === 'PATIENT' && pathname !== '/patient') {
      router.push('/patient');
    } else if (target === 'DOCTOR' && pathname !== '/doctor') {
      router.push('/doctor');
    } else if (target === 'ADMIN' && pathname !== '/admin') {
      router.push('/admin');
    }
  }, [isActive, currentStepIndex, currentStepInfo, pathname, router]);

  if (!isActive) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up font-sans">
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/95 px-4 py-2 text-white shadow-2xl backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 mr-1">
            <Zap className="h-4 w-4 text-white animate-pulse" />
            <span className="hidden sm:inline">Agentic Control Bar</span>
          </span>
          <button
            onClick={() => startDemo('PATIENT_DEMO')}
            className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-zinc-950 hover:bg-zinc-100 transition active:scale-95 shadow-sm"
          >
            <span>▶ Start Patient Demo</span>
          </button>
          <button
            onClick={() => startDemo('ADMIN_DEMO')}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-700 px-3.5 py-1 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition active:scale-95"
          >
            <span>▶ Start Admin Demo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl animate-slide-up font-sans">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 border-zinc-700/80">
        
        {/* Left Section: Step Number, Mode Badge & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold shrink-0">
            {isExecutingAction ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Zap className="h-4 w-4 animate-pulse text-white" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-900 bg-white px-2 py-0.5 rounded font-mono shrink-0">
                {demoMode === 'PATIENT_DEMO' ? 'PATIENT DEMO' : 'ADMIN DEMO'} • {currentStepIndex + 1}/{totalSteps}
              </span>
              <span className="text-xs font-bold text-white truncate">
                {isExecutingAction && executingStatusText ? executingStatusText : currentStepInfo.title}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate hidden sm:block font-normal">
              {currentStepInfo.desc}
            </p>
          </div>
        </div>

        {/* Center: Live Timer Badge OR Executing Status Badge */}
        {isExecutingAction ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white shrink-0 animate-pulse font-mono">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Executing...</span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold shrink-0 font-mono ${
            currentStepInfo.isHalt
              ? 'border-zinc-500 bg-zinc-900 text-white ring-1 ring-zinc-500'
              : 'border-zinc-700 bg-zinc-900 text-zinc-200'
          }`}>
            <Clock className="h-3.5 w-3.5 text-zinc-300" />
            <span>{currentStepInfo.isHalt ? `Halt: ${remainingSeconds}s` : `Timer: ${remainingSeconds}s`}</span>
          </div>
        )}

        {/* Right Section: Compact Pause / Resume / Stop Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPaused ? (
            <button
              onClick={resumeDemo}
              className="flex items-center gap-1 rounded-lg bg-zinc-100 text-zinc-900 px-2.5 py-1 text-xs font-extrabold hover:bg-white transition"
              title="Resume demo"
            >
              <Play className="h-3 w-3 fill-zinc-900" />
              <span className="hidden sm:inline">Resume</span>
            </button>
          ) : (
            <button
              onClick={pauseDemo}
              className="flex items-center gap-1 rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-zinc-700 transition"
              title="Pause demo"
            >
              <Pause className="h-3 w-3 fill-white" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}

          <button
            onClick={stopDemo}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition"
            title="Stop demo"
          >
            <Square className="h-3 w-3 fill-zinc-400" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        </div>

      </div>
    </div>
  );
}
