import React, { useState, useEffect } from 'react';

export type DemoMode = 'ADMIN_DEMO' | 'PATIENT_DEMO';

export interface DemoStepInfo {
  step: number;
  agentBadge: string;
  title: string;
  desc: string;
  durationSeconds: number; // Timer duration in seconds
  isHalt?: boolean;
  targetRole: 'ADMIN' | 'DOCTOR' | 'PATIENT';
}

export const DEMO_STEPS_ADMIN: DemoStepInfo[] = [
  {
    step: 1,
    agentBadge: '⚡ Intelligence Layer Initializing',
    title: 'Waking Up Agentic Operating System',
    desc: 'System wake-up command "wakeup" received. Closing chatbot & launching Intelligence Layer Control Bar...',
    durationSeconds: 2,
    targetRole: 'ADMIN'
  },
  {
    step: 2,
    agentBadge: '🤖 Agent 1: Admin Operations Engine',
    title: 'Opening Operation Schedule Form',
    desc: 'Opening Create & Schedule Operation Modal in Admin Command Center...',
    durationSeconds: 1,
    targetRole: 'ADMIN'
  },
  {
    step: 3,
    agentBadge: '⏸️ User Inspection Halt (5 Seconds)',
    title: 'Create Operation Box (5s Edit/Inspect Halt)',
    desc: 'Halted for 5 seconds to inspect or edit operation details (Patient, Doctor, Procedure, OT, Date/Time)...',
    durationSeconds: 5,
    isHalt: true,
    targetRole: 'ADMIN'
  },
  {
    step: 4,
    agentBadge: '🤖 Agent 1 & Hospital Event Bus',
    title: 'Creating Operation & Notifying Doctor',
    desc: 'Submitting operation data to SQLite DB and broadcasting URGENT notification to Dr. Sarah Jenkins...',
    durationSeconds: 2,
    targetRole: 'ADMIN'
  },
  {
    step: 5,
    agentBadge: '🤖 Agent 2: Flow Orchestration',
    title: 'Switching to Admin Agents Flow Panel',
    desc: 'Navigating Admin View to Admin Agent Workflows tab for pre-op claims compliance verification...',
    durationSeconds: 2,
    targetRole: 'ADMIN'
  },
  {
    step: 6,
    agentBadge: '🤖 Agent 3 & 4: Groq LLM Claims Validator',
    title: 'Executing 4-Agent Workflow on uploads/test_claim.json',
    desc: 'Running Agent 1 (Intake) -> Agent 2 (Coding) -> Agent 3 (Policy) -> Agent 4 (Groq LLM inference)...',
    durationSeconds: 4,
    targetRole: 'ADMIN'
  },
  {
    step: 7,
    agentBadge: '🤖 Agent 5B: Voice Agent Call Active',
    title: 'Voice Agent 5B Call Running (Audio Call Active)',
    desc: 'Agent 4 Groq LLM rejected claim. Deepgram Voice Agent 5B audio call running... Waiting for voice call to complete...',
    durationSeconds: 8,
    targetRole: 'ADMIN'
  },
  {
    step: 8,
    agentBadge: '🤖 Agent 5B: Voice Pre-Auth Resolution',
    title: 'Submitting Voice Response: YES',
    desc: 'Voice call completed! Patient answered "YES". Agent 5B correcting claim & clearing insurance pre-authorization...',
    durationSeconds: 3,
    targetRole: 'ADMIN'
  },
  {
    step: 9,
    agentBadge: '⏸️ Pre-Auth Clearance Halt (10s)',
    title: '10-Second Pre-Auth Clearance Inspection Halt',
    desc: 'Halted for 10 seconds to inspect insurance pre-authorization clearance before navigating to Doctor Cockpit...',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'ADMIN'
  },
  {
    step: 10,
    agentBadge: '🔄 System Role Navigation',
    title: 'Switching View to Doctor Sarah Jenkins Cockpit',
    desc: 'Navigating automatically to Doctor Portal (/doctor)...',
    durationSeconds: 2,
    targetRole: 'DOCTOR'
  },
  {
    step: 11,
    agentBadge: '🤖 Doctor Readiness Scorecard',
    title: 'AI Surgery Readiness Audit (100% Score)',
    desc: 'Evaluating 5 clinical & administrative domains... Score updated to 100% (5/5 factors cleared)!',
    durationSeconds: 3,
    targetRole: 'DOCTOR'
  },
  {
    step: 12,
    agentBadge: '🤖 Doctor Lab Scan Dispatcher',
    title: 'Ordering Pre-Op Diagnostic Scan',
    desc: 'Opening Lab Scan Order modal, entering Pre-Op Cardiac CT Scan, and dispatching to Lab Tech...',
    durationSeconds: 4,
    targetRole: 'DOCTOR'
  },
  {
    step: 13,
    agentBadge: '🤖 Doctor Agent & Calendar Engine',
    title: 'Running Doctor Readiness Agent Panel',
    desc: 'Executing Doctor Readiness Agent Flow Panel and updating Doctor Operations Calendar...',
    durationSeconds: 4,
    targetRole: 'DOCTOR'
  },
  {
    step: 14,
    agentBadge: '⏸️ Doctor Readiness Result Halt (5s)',
    title: '5-Second Doctor Readiness Result Inspection Halt',
    desc: 'Halted for 5 seconds to inspect Doctor Readiness Agent verification result before summary...',
    durationSeconds: 5,
    isHalt: true,
    targetRole: 'DOCTOR'
  },
  {
    step: 15,
    agentBadge: '🎉 Crisp Operation Summary',
    title: 'End-to-End System Demo Completed!',
    desc: 'Displaying final operational summary dialog box for CABG surgery.',
    durationSeconds: 0,
    targetRole: 'DOCTOR'
  }
];

export const DEMO_STEPS_PATIENT: DemoStepInfo[] = [
  {
    step: 1,
    agentBadge: '🤖 Patient Care Navigator Agent',
    title: 'Chatbot Wake-Up & Conflict Detection',
    desc: 'Opening Chatbot & detecting existing appointment today at 10:30 AM in DB memory...',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'PATIENT'
  },
  {
    step: 2,
    agentBadge: '🤖 Reschedule & 1st Time Patient Intake',
    title: 'Rescheduling to Aug 23 (10:00 AM) & Symptoms Intake',
    desc: 'Booking Aug 23 at 10:00 AM with symptoms (headache, sore throat, vomiting). Recorded 1st Time Patient visit...',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'PATIENT'
  },
  {
    step: 3,
    agentBadge: '👨‍⚕️ Doctor Operations Calendar',
    title: 'Inspecting New Booking on Doctor Calendar',
    desc: 'Navigating to Doctor Portal (/doctor) and opening appointment details modal for Aug 23 at 10:00 AM...',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'DOCTOR'
  },
  {
    step: 4,
    agentBadge: '💳 Claims & Policy Cost Analyzer',
    title: 'Dental Implantation Coverage & Cost Query',
    desc: 'Analyzing Star Health policy coverage for dental implantation, calculating out-of-pocket costs & prompting scan booking...',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'PATIENT'
  },
  {
    step: 5,
    agentBadge: '🔬 Pre-Op Scan Order Dispatcher',
    title: 'Confirming Pre-Op Dental Scan Order',
    desc: 'Confirmed "Yes, book a scan". Saved diagnostic scan order to SQLite DB and updated Patient Notifications!',
    durationSeconds: 10,
    isHalt: true,
    targetRole: 'PATIENT'
  }
];

// Alias for backwards compatibility
export const DEMO_STEPS = DEMO_STEPS_ADMIN;

export interface DemoState {
  isActive: boolean;
  demoMode: DemoMode;
  currentStepIndex: number;
  isPaused: boolean;
  remainingSeconds: number;
  isExecutingAction: boolean;
  executingStatusText?: string;
}

type Listener = (state: DemoState) => void;

let state: DemoState = {
  isActive: false,
  demoMode: 'ADMIN_DEMO',
  currentStepIndex: 0,
  isPaused: false,
  remainingSeconds: 0,
  isExecutingAction: false,
  executingStatusText: undefined
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l(state));
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hospital_demo_state', JSON.stringify(state));
  }
}

if (typeof window !== 'undefined') {
  try {
    const saved = sessionStorage.getItem('hospital_demo_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.isActive) {
        state = parsed;
      }
    }
  } catch (e) {}
}

export function getStepsForMode(mode: DemoMode): DemoStepInfo[] {
  return mode === 'PATIENT_DEMO' ? DEMO_STEPS_PATIENT : DEMO_STEPS_ADMIN;
}

let timerInterval: any = null;

function ensureTimerLoop() {
  if (typeof window === 'undefined') return;
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      demoEngine.tickTimer();
    }, 1000);
  }
}

function stopTimerLoop() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export const demoEngine = {
  getState: () => state,

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(state);
    if (state.isActive) ensureTimerLoop();
    return () => {
      listeners.delete(listener);
    };
  },

  startDemo: (mode: DemoMode = 'ADMIN_DEMO') => {
    const steps = getStepsForMode(mode);
    state = {
      isActive: true,
      demoMode: mode,
      currentStepIndex: 0,
      isPaused: false,
      remainingSeconds: steps[0].durationSeconds,
      isExecutingAction: false,
      executingStatusText: undefined
    };
    ensureTimerLoop();
    notify();
  },

  stopDemo: () => {
    state = {
      isActive: false,
      demoMode: 'ADMIN_DEMO',
      currentStepIndex: 0,
      isPaused: false,
      remainingSeconds: 0,
      isExecutingAction: false,
      executingStatusText: undefined
    };
    stopTimerLoop();
    notify();
  },

  pauseDemo: () => {
    state = { ...state, isPaused: true };
    notify();
  },

  resumeDemo: () => {
    state = { ...state, isPaused: false };
    ensureTimerLoop();
    notify();
  },

  setIsExecutingAction: (executing: boolean, statusText?: string) => {
    state = {
      ...state,
      isExecutingAction: executing,
      executingStatusText: statusText
    };
    notify();
  },

  nextStep: () => {
    const steps = getStepsForMode(state.demoMode);
    const nextIdx = state.currentStepIndex + 1;
    if (nextIdx < steps.length) {
      state = {
        ...state,
        currentStepIndex: nextIdx,
        remainingSeconds: steps[nextIdx].durationSeconds,
        isExecutingAction: false,
        executingStatusText: undefined
      };
      notify();
    } else {
      state = { ...state, isActive: false, isExecutingAction: false };
      stopTimerLoop();
      notify();
    }
  },

  setStep: (stepIdx: number) => {
    const steps = getStepsForMode(state.demoMode);
    if (stepIdx >= 0 && stepIdx < steps.length) {
      state = {
        ...state,
        currentStepIndex: stepIdx,
        remainingSeconds: steps[stepIdx].durationSeconds,
        isExecutingAction: false,
        executingStatusText: undefined
      };
      notify();
    }
  },

  tickTimer: () => {
    if (state.isPaused || !state.isActive || state.isExecutingAction) return;
    if (state.remainingSeconds > 1) {
      state = { ...state, remainingSeconds: state.remainingSeconds - 1 };
      notify();
    } else if (state.remainingSeconds === 1) {
      state = { ...state, remainingSeconds: 0 };
      notify();
      demoEngine.nextStep();
    }
  }
};

export function useDemoEngine() {
  const [demoState, setDemoState] = useState<DemoState>(demoEngine.getState());

  useEffect(() => {
    const unsubscribe = demoEngine.subscribe(setDemoState);
    return () => { unsubscribe(); };
  }, []);

  const currentSteps = getStepsForMode(demoState.demoMode);

  return {
    ...demoState,
    currentStepInfo: currentSteps[demoState.currentStepIndex] || currentSteps[0],
    totalSteps: currentSteps.length,
    startDemo: demoEngine.startDemo,
    stopDemo: demoEngine.stopDemo,
    pauseDemo: demoEngine.pauseDemo,
    resumeDemo: demoEngine.resumeDemo,
    nextStep: demoEngine.nextStep,
    setStep: demoEngine.setStep,
    setIsExecutingAction: demoEngine.setIsExecutingAction
  };
}

