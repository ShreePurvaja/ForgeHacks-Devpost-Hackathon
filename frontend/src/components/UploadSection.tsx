'use client';

import React, { useState, useRef } from 'react';
import { Upload, FlaskConical, Layers, Loader2, FileJson, Clock } from 'lucide-react';
import { uploadClaimFile } from '@/lib/api';

interface UploadSectionProps {
  onWorkflowTriggered: (batchId: string) => void;
  recentWorkflows: Array<{ id: string; claim_id: string; status: string; current_step: string; start_time: string }>;
}

export default function UploadSection({ onWorkflowTriggered, recentWorkflows }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setStatusMessage('Error: Only JSON files are allowed.');
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(`Uploading ${file.name}...`);
      const result = await uploadClaimFile(file);
      setStatusMessage(result.message || 'Workflow started successfully!');
      onWorkflowTriggered(result.batch_id);
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Sample Single Claim trigger
  const handleSampleClaim = async () => {
    const sampleClaimData = {
      id: `CLM_SAMPLE_${Date.now().toString().slice(-4)}`,
      patient_id: "pat001",
      patient_name: "John Smith",
      code: "99213",
      procedure_code: "99213",
      description: "Office or other outpatient visit for low complexity decision making",
      dose: 1.0,
      units: 1,
      date_of_service: "2026-08-20",
      diagnosis: "M54.5"
    };

    const file = new File([JSON.stringify(sampleClaimData, null, 2)], `sample_claim_${Date.now()}.json`, {
      type: 'application/json',
    });
    await processFile(file);
  };

  // Batch Claim trigger
  const handleBatchSample = async () => {
    const batchData = [
      {
        id: `CLM_BATCH1_${Date.now().toString().slice(-4)}`,
        patient_id: "pat001",
        code: "99214",
        procedure_code: "99214",
        dose: 1.0,
        units: 1,
        date_of_service: "2026-08-20",
        diagnosis: "E11.9"
      },
      {
        id: `CLM_BATCH2_${Date.now().toString().slice(-4)}`,
        patient_id: "pat002",
        code: "99215",
        procedure_code: "99215",
        dose: 2.0,
        units: 2,
        date_of_service: "2026-08-20",
        diagnosis: "I10"
      }
    ];

    const file = new File([JSON.stringify(batchData, null, 2)], `batch_sample_${Date.now()}.json`, {
      type: 'application/json',
    });
    await processFile(file);
  };

  return (
    <div className="space-y-5">
      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-400" /> Upload Claim Data
        </h2>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/70'
          }`}
        >
          <FileJson className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-xs font-medium text-slate-300">
            Drag & drop JSON claim file here, or <span className="text-blue-400 hover:underline">browse</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Supports single claim or batch JSON array</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleSampleClaim}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/90 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
          >
            <FlaskConical className="h-4 w-4" />
            <span>Sample Claim</span>
          </button>

          <button
            onClick={handleBatchSample}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600/90 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-500 active:scale-95 disabled:opacity-50"
          >
            <Layers className="h-4 w-4" />
            <span>Batch Sample</span>
          </button>
        </div>

        {/* Status indicator */}
        {statusMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-950/60 p-2.5 text-xs text-blue-400 border border-slate-800">
            {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />}
            <span className="truncate">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Recent Workflows Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" /> Recent Workflows
        </h3>

        {recentWorkflows.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-3">No active workflows</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recentWorkflows.slice(0, 5).map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs"
              >
                <div>
                  <p className="font-mono text-slate-200">{wf.claim_id || wf.id}</p>
                  <p className="text-[10px] text-slate-400">{wf.current_step || 'Processing'}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    wf.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                  }`}
                >
                  {wf.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
