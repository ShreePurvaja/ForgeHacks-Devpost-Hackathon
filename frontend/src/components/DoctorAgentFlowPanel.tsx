'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, RefreshCw } from 'lucide-react';
import { 
  runDoctorReadinessAgent, runDoctorClearanceAgent, runDoctorDispatchScanAgent 
} from '@/lib/api';
import { DoctorNavTab } from './DoctorSidebarNav';

interface DoctorAgentFlowPanelProps {
  agentTab: DoctorNavTab;
}

export default function DoctorAgentFlowPanel({ agentTab }: DoctorAgentFlowPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [agentOutput, setAgentOutput] = useState<any>(null);

  // Clear agent output whenever agentTab changes so old outputs don't linger
  useEffect(() => {
    setAgentOutput(null);
    setIsRunning(false);
  }, [agentTab]);

  const agentTitles: Record<string, { name: string; type: string; desc: string }> = {
    READINESS_AGENT: {
      name: 'Surgery Readiness Coordinator Agent',
      type: 'READINESS',
      desc: 'LangGraph micro-agent scanning 5 clinical readiness domains over HL7 FHIR with Groq LLM.'
    },
    CLEARANCE_AGENT: {
      name: 'Clinical Pre-Op Clearer Agent',
      type: 'CLEARANCE',
      desc: 'Evaluates real-time EHR patient vitals & ASA Physical Status classification via Groq LLM.'
    },
    DISPATCH_SCAN_AGENT: {
      name: 'Diagnostic Scan Dispatcher Agent',
      type: 'DISPATCH',
      desc: 'Formats doctor orders into HL7 FHIR ServiceRequest schema & emits SCAN_ORDERED event.'
    }
  };

  const currentAgent = agentTitles[agentTab] || agentTitles.READINESS_AGENT;

  const handleRunAgent = async () => {
    try {
      setIsRunning(true);
      setAgentOutput(null);

      let data;
      if (currentAgent.type === 'READINESS') {
        data = await runDoctorReadinessAgent('CLM001');
      } else if (currentAgent.type === 'CLEARANCE') {
        data = await runDoctorClearanceAgent('pat001', 'ASA_II');
      } else {
        data = await runDoctorDispatchScanAgent({
          doctor_name: 'Dr. Sarah Jenkins',
          patient_name: 'Robert Johnson',
          scan_name: 'Pre-Op Cardiac MRI',
          priority: 'URGENT'
        });
      }

      setAgentOutput(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div key={agentTab} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 animate-slide-up text-zinc-900">
      {/* Agent Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white font-bold shadow-sm">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold tracking-tight text-zinc-900">{currentAgent.name}</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                LangChain & Groq Powered
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">{currentAgent.desc}</p>
          </div>
        </div>

        <button
          onClick={handleRunAgent}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition active:scale-95 disabled:opacity-40"
        >
          {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
          <span>Trigger Agentic Reasoning Loop</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isRunning && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-6 text-center space-y-3 animate-pulse">
          <RefreshCw className="h-6 w-6 text-zinc-900 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900">Agent Executing LangGraph Reasoning Chain...</h4>
          <p className="text-xs text-zinc-500 font-normal">Querying SQLite FHIR store, scanning vitals, and calling Groq LLM (openai/gpt-oss-120b)</p>
        </div>
      )}

      {/* 1. Reasoning Steps Timeline (Sense -> Plan -> Act) FIRST */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Agent Reasoning Execution Pipeline</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sense Step */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-900" />
                1. Sense Step
              </span>
              <span className="text-[10px] font-medium text-zinc-500">FHIR Ingestion</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-2 list-disc pl-4 font-normal">
              {agentOutput?.reasoning_steps?.sense ? (
                agentOutput.reasoning_steps.sense.map((log: string, idx: number) => (
                  <li key={idx} className="leading-snug">{log}</li>
                ))
              ) : (
                <>
                  <li>Scanning SQLite FHIR procedure store...</li>
                  <li>Fetching ECG, Troponin, Radiology scans...</li>
                  <li>Verifying Blood Bank unit reservations...</li>
                </>
              )}
            </ul>
          </div>

          {/* Plan Step */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-900" />
                2. Plan Step
              </span>
              <span className="text-[10px] font-medium text-zinc-500">Groq LLM Reasoning</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-2 list-disc pl-4 font-normal">
              {agentOutput?.reasoning_steps?.plan ? (
                agentOutput.reasoning_steps.plan.map((log: string, idx: number) => (
                  <li key={idx} className="leading-snug">{log}</li>
                ))
              ) : (
                <>
                  <li>Evaluating 5-domain surgical criteria...</li>
                  <li>Checking hemodynamic stability & vitals...</li>
                  <li>Computing readiness score against thresholds...</li>
                </>
              )}
            </ul>
          </div>

          {/* Act Step */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-900" />
                3. Act Step
              </span>
              <span className="text-[10px] font-medium text-zinc-500">State Transition</span>
            </div>
            <ul className="text-xs text-zinc-700 space-y-2 list-disc pl-4 font-normal">
              {agentOutput?.reasoning_steps?.act ? (
                agentOutput.reasoning_steps.act.map((log: string, idx: number) => (
                  <li key={idx} className="leading-snug">{log}</li>
                ))
              ) : (
                <>
                  <li>Pushed live score to Doctor Cockpit...</li>
                  <li>Published event to Hospital Event Bus...</li>
                  <li>Logged NIST FHIR AuditEvent provenance record...</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Modern Agent Execution Result Card SECOND (Below Steps) */}
      {agentOutput && !isRunning && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-6 space-y-5 animate-slide-up">
          {/* Output Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agent Execution Result</span>
              <h4 className="text-lg font-bold text-zinc-900 mt-0.5">
                {agentOutput.status_label || agentOutput.message || (agentOutput.cleared ? 'CLINICAL CLEARANCE GRANTED' : 'COMPLETED')}
              </h4>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-md bg-zinc-900 text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified Output</span>
            </span>
          </div>

          {/* Key-Value Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {agentOutput.readiness_score !== undefined && (
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] font-semibold text-zinc-500">Readiness Score</span>
                <p className="text-2xl font-bold text-zinc-900">{agentOutput.readiness_score}%</p>
              </div>
            )}

            {agentOutput.asa_class && (
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] font-semibold text-zinc-500">ASA Physical Score</span>
                <p className="text-base font-bold text-zinc-900">{agentOutput.asa_class}</p>
              </div>
            )}

            {agentOutput.scan_id && (
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] font-semibold text-zinc-500">ServiceRequest ID</span>
                <p className="text-base font-bold text-zinc-900">{agentOutput.scan_id}</p>
              </div>
            )}
          </div>

          {/* 5 Readiness Factors List with Checkmarks */}
          {agentOutput.checkpoints && (
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                5 Surgical Readiness Factors Evaluation
              </h5>

              <div className="grid grid-cols-1 gap-2.5">
                {agentOutput.checkpoints.map((cp: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border p-3 transition ${
                      cp.ready
                        ? 'border-zinc-200 bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        : 'border-zinc-200 bg-zinc-100 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cp.ready ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-xs shadow-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 font-bold text-xs">
                          ✕
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{cp.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Clinical Factor #{idx + 1}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-3 py-1 rounded-md border ${
                        cp.ready
                          ? 'bg-zinc-100 text-zinc-900 border-zinc-300 uppercase tracking-wider'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {cp.ready ? '✓ VERIFIED CLEARED' : '✕ PENDING / BLOCKED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agentOutput.llm_analysis && (
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">Groq LLM Clinical Reasoning</span>
              <p className="text-xs font-normal text-zinc-700 leading-relaxed">{agentOutput.llm_analysis}</p>
            </div>
          )}

          {agentOutput.recommendation && (
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider">Clinical Recommendation</span>
              <p className="text-xs font-normal text-zinc-700 leading-relaxed">{agentOutput.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
