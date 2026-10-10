'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Bell, ShieldCheck, Heart, Sparkles, Clock, Globe, CreditCard, Save, CheckCircle2, TrendingUp 
} from 'lucide-react';
import { fetchPatientNotifications, fetchPatientProfile, updateCashThreshold, PatientNotification, PatientProfile } from '@/lib/api';
import { PatientLang, PATIENT_TRANSLATIONS } from '@/lib/i18n/patient_translations';
import PatientCalendarWidget from './PatientCalendarWidget';
import PatientInsuranceWidget from './PatientInsuranceWidget';
import PatientFloatingChatbot from './PatientFloatingChatbot';
import { demoEngine } from '@/lib/demoEngine';

interface RolePatientViewProps {
  claims?: any[];
  onOpenVoiceModal?: (workflowId: string) => void;
}

export default function RolePatientView({ claims = [], onOpenVoiceModal }: RolePatientViewProps) {
  const [lang, setLang] = useState<PatientLang>('en');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat001');
  const [profile, setProfile] = useState<PatientProfile>({
    id: 'pat001',
    first_name: 'Robert',
    last_name: 'Johnson',
    date_of_birth: '1958-11-30',
    gender: 'M',
    phone: '+1-555-0192',
    email: 'robert.j@email.com',
    cash_threshold: 100000.0,
    active_policy: 'Star Health Comprehensive Gold PPO',
    policy_limit: 500000.0,
    deductible_used: 15000.0,
    primary_diagnosis: 'Coronary Artery Disease'
  });

  const [thresholdInput, setThresholdInput] = useState<number>(100000);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const t = PATIENT_TRANSLATIONS[lang] || PATIENT_TRANSLATIONS.en;

  const loadData = async () => {
    const [prof, notifs] = await Promise.all([
      fetchPatientProfile(selectedPatientId),
      fetchPatientNotifications(selectedPatientId)
    ]);
    setProfile(prof);
    setThresholdInput(prof.cash_threshold || 100000);
    setNotifications(notifs);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [selectedPatientId]);

  const handleSaveThreshold = async () => {
    await updateCashThreshold(selectedPatientId, thresholdInput);
    setProfile(prev => ({ ...prev, cash_threshold: thresholdInput }));
    setSavedSuccessMsg('Emergency Cash Threshold updated to ₹' + thresholdInput.toLocaleString('en-IN'));
    setTimeout(() => setSavedSuccessMsg(null), 2500);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-24 relative text-zinc-900">
      {/* Top Banner & Language Selector */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900">{t.portalTitle}</h2>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 border border-zinc-200 uppercase tracking-wider">
                Patient Scope
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl font-normal leading-relaxed">{t.portalSubtitle}</p>
          </div>
        </div>

        {/* Controls: Demo Trigger & Scope Language Selector */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => demoEngine.startDemo('PATIENT_DEMO')}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition active:scale-95"
            title="Launch Automated Patient Demo Flow"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>Launch Patient Care & Dental Demo</span>
          </button>

          <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
            <Globe className="h-4 w-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-600">Language:</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as PatientLang)}
              className="rounded-lg bg-white border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-900 focus:outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Profile & Emergency Cash Threshold Setting Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {profile.first_name} {profile.last_name}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                DOB: {profile.date_of_birth} • Phone: {profile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700">
            <ShieldCheck className="h-4 w-4 text-zinc-600" />
            <span>Active: {profile.active_policy}</span>
          </div>
        </div>

        {/* Cash Threshold Setting Block */}
        <div className="p-5 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="h-4 w-4 text-zinc-600" />
                <span>{t.cashThresholdLabel}</span>
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1">{t.cashThresholdDesc}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400 pointer-events-none">₹</span>
                <input
                  type="number"
                  step="5000"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(Number(e.target.value))}
                  className="w-48 bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-zinc-900 focus:border-zinc-500 focus:outline-none tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
              </div>

              <button
                onClick={handleSaveThreshold}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 transition shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{t.saveThreshold}</span>
              </button>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="text-xs font-medium text-zinc-800 bg-white p-3 rounded-lg border border-zinc-200 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <CheckCircle2 className="h-4 w-4 text-zinc-700" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* Reasoning Indicator Rule Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-200 text-xs">
            <div className="p-3.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-600" /> Care Cost &lt; ₹{thresholdInput.toLocaleString('en-IN')}
              </span>
              <p className="text-zinc-500 text-[11px] leading-relaxed">{t.cashRecommendation}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" /> Care Cost ≥ ₹{thresholdInput.toLocaleString('en-IN')}
              </span>
              <p className="text-zinc-500 text-[11px] leading-relaxed">{t.insuranceRecommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visit Notifications Alert Banner */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-600" />
            Live Hospital Visit & Care Notifications
          </h3>
          <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200 uppercase tracking-wider">
            Synced
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-400 font-mono">
            {t.noVisits}
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    {n.type.replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-zinc-900 mt-2">{n.title}</h4>
                  <p className="text-zinc-600 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
                {n.action_required && (
                  <span className="font-medium text-zinc-800 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shrink-0 flex items-center gap-1.5 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{n.action_required}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Visit Calendar Widget */}
      <PatientCalendarWidget lang={lang} />

      {/* Visual Insurance Policy & Scheme Comparison Widget */}
      <PatientInsuranceWidget
        lang={lang}
        activePolicy={profile.active_policy}
        policyLimit={profile.policy_limit}
        deductibleUsed={profile.deductible_used}
        cashThreshold={profile.cash_threshold}
      />

      {/* Floating AI Navigation Agent (Bottom Right Corner) */}
      <PatientFloatingChatbot
        patientId={selectedPatientId}
        cashThreshold={profile.cash_threshold}
        lang={lang}
      />
    </div>
  );
}
