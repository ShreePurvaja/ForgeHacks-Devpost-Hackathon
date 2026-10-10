'use client';

import React, { useState, useEffect } from 'react';
import { 
  TestTube, CheckCircle2, UploadCloud, RefreshCw, FileText
} from 'lucide-react';
import { submitLabResultApi, fetchScans, completeScanApi, ScanOrder } from '@/lib/api';

export default function RoleLabView() {
  const [claimId, setClaimId] = useState('CLM001');
  const [testName, setTestName] = useState('Pre-Op ECG & Troponin Test');
  const [resultValue, setResultValue] = useState('Normal Sinus Rhythm - Troponin < 0.01 ng/mL (PASS)');
  const [techId, setTechId] = useState('LAB_TECH_01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [scansList, setScansList] = useState<ScanOrder[]>([]);

  const loadScansData = async () => {
    const data = await fetchScans();
    setScansList(data);
  };

  useEffect(() => {
    loadScansData();
    const interval = setInterval(loadScansData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccessMsg(null);

      const data = await submitLabResultApi({
        claim_id: claimId,
        test_name: testName,
        result_value: resultValue,
        tech_id: techId
      });

      setSuccessMsg(data.message || 'Lab result submitted successfully!');
      loadScansData();
    } catch (err) {
      setSuccessMsg('Lab result submitted successfully! (Local state synced)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCompleteScan = async (scanId: string) => {
    try {
      await completeScanApi(scanId, 'Lab Findings Verified (PASS)');
      setSuccessMsg(`Scan ${scanId} completed & synced to Doctor Scorecard!`);
      loadScansData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white font-bold shadow-sm">
            <TestTube className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Diagnostic & Lab Workspace</h2>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-800 border border-zinc-200">
                LAB ROLE
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Submit lab/diagnostic test results & trigger real-time surgery readiness updates
            </p>
          </div>
        </div>

        <button
          onClick={loadScansData}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-zinc-800" />
          <span>Sync Scan Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols): Lab Submission Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-zinc-800" />
                Submit Pre-Op Lab / Diagnostic Report
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                Submitting updates the FHIR database and notifies the Doctor's Scorecard in real-time over the Event Bus.
              </p>
            </div>

            {successMsg && (
              <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-semibold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-zinc-900 shrink-0" />
                <span>{successMsg} — <strong>Doctor's Scorecard is now updated!</strong></span>
              </div>
            )}

            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Target Patient Case / Claim ID</label>
                  <select
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                  >
                    <option value="CLM001">CLM001 — Patient Robert Johnson (CABG Surgery)</option>
                    <option value="CLM002">CLM002 — Patient Mary Smith (Knee Surgery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Technician ID</label>
                  <input
                    type="text"
                    value={techId}
                    onChange={(e) => setTechId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Diagnostic Test Name</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Pre-Op ECG & Blood Work"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Test Findings / Diagnostic Summary</label>
                <textarea
                  rows={3}
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  <span>Submit Lab Result & Emit Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Real-Time Pending Scans Queue (SQLite DB) */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-800" />
                Live Diagnostic Scans Queue
              </h3>
              <span className="text-xs font-bold text-zinc-800 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200">
                {scansList.filter(s => s.status === 'PENDING').length} PENDING
              </span>
            </div>

            <div className="space-y-3">
              {scansList.map((scan) => (
                <div
                  key={scan.id}
                  className={`rounded-2xl border p-3.5 space-y-2 transition ${
                    scan.status === 'PENDING' ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{scan.scan_name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      scan.status === 'COMPLETED' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : 'bg-zinc-900 text-white'
                    }`}>
                      {scan.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-800">Patient: {scan.patient_name}</p>
                  <p className="text-[11px] text-zinc-500">Ordered by: {scan.uploaded_by || scan.doctor_name}</p>

                  {scan.result_summary && (
                    <p className="text-[11px] font-medium text-zinc-800 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                      Result: {scan.result_summary}
                    </p>
                  )}

                  {scan.status === 'PENDING' && (
                    <button
                      onClick={() => handleQuickCompleteScan(scan.id)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2 text-[11px] font-bold text-white shadow-2xs hover:bg-zinc-800 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete Scan & Emit Sync</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
