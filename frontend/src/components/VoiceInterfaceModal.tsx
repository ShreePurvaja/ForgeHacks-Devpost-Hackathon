'use client';

import React, { useState } from 'react';
import { PhoneCall, Check, X, Volume2, Mic, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sendVoiceResponse } from '@/lib/api';

interface VoiceInterfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string | null;
  transcript?: string;
  voiceStatus?: 'speaking' | 'listening' | 'idle';
  audioUrl?: string;
}

export default function VoiceInterfaceModal({
  isOpen,
  onClose,
  workflowId,
  transcript = "Agent 5B: Hello! I'm calling regarding your submitted healthcare claim for CPT code 99213. We noticed an authorization update. Would you like us to automatically re-submit with updated policy documents?",
  voiceStatus = 'listening',
  audioUrl,
}: VoiceInterfaceModalProps) {
  const [responseSubmitted, setResponseSubmitted] = useState<'YES' | 'NO' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Speak transcript using Web Speech API when modal opens
  const speakTranscript = React.useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = transcript.replace(/^Agent\s*5B:\s*/i, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [transcript]);

  React.useEffect(() => {
    if (isOpen) {
      speakTranscript();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, speakTranscript]);

  if (!isOpen || !workflowId) return null;

  const handleResponse = async (choice: 'YES' | 'NO') => {
    try {
      setIsSubmitting(true);
      await sendVoiceResponse(workflowId, choice);
      setResponseSubmitted(choice);
    } catch (err) {
      console.error('Failed to submit voice choice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-slide-up">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/90 to-slate-900/95 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 mb-3 shadow-lg">
            <PhoneCall className="h-7 w-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">Voice Agent 5B — Patient Call</h3>
          <p className="text-xs text-indigo-300 mt-1">Interactive Telephony Verification</p>
        </div>

        {/* Audio Waveform Animation */}
        <div className="flex items-center justify-center gap-1.5 h-16 my-4">
          {[0.3, 0.6, 1.0, 0.7, 0.4, 0.9, 0.5, 0.8, 0.3].map((delay, idx) => (
            <div
              key={idx}
              className={`w-2 rounded-full bg-gradient-to-t from-indigo-500 to-amber-400 transition-all wave-bar-anim ${
                voiceStatus === 'idle' ? 'h-3 opacity-40' : 'h-12 shadow-lg shadow-indigo-500/50'
              }`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              voiceStatus === 'speaking'
                ? 'bg-amber-400 animate-ping'
                : voiceStatus === 'listening'
                ? 'bg-blue-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-medium text-slate-300 capitalize flex items-center gap-1">
            {voiceStatus === 'speaking' && <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
            {voiceStatus === 'listening' && <Mic className="h-3.5 w-3.5 text-blue-400" />}
            Status: {voiceStatus}...
          </span>
        </div>

        {/* Audio Player if URL available */}
        {audioUrl && (
          <div className="mb-4">
            <audio controls src={audioUrl} className="w-full h-8 rounded-lg text-xs" />
          </div>
        )}

        {/* Transcript Box */}
        <div className="rounded-2xl border border-indigo-500/20 bg-slate-950/60 p-4 mb-6 text-xs text-slate-200 leading-relaxed shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-indigo-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Mic className="h-3 w-3" /> Call Transcript
            </p>
            <button
              onClick={speakTranscript}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-200 transition bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
            >
              <Volume2 className="h-3 w-3" /> {isPlayingAudio ? 'Speaking...' : 'Replay Audio'}
            </button>
          </div>
          <p className="italic">{transcript}</p>
        </div>

        {/* User Choice / Action buttons */}
        {responseSubmitted ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-300">
              Response recorded: {responseSubmitted}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Agent 5B is updating the FHIR claims workflow.
            </p>
            <button
              onClick={onClose}
              className="mt-3 text-xs text-slate-300 underline hover:text-white"
            >
              Close overlay
            </button>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleResponse('YES')}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Yes, correct it
            </button>
            <button
              onClick={() => handleResponse('NO')}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3 text-xs font-bold text-slate-300 shadow-lg transition hover:bg-slate-800 hover:text-white active:scale-95 disabled:opacity-50"
            >
              <X className="h-4 w-4" /> No, appeal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
