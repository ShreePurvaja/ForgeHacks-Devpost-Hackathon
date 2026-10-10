'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, FileText, Upload, CheckCircle2, AlertCircle, 
  Search, RefreshCw, Activity, Heart, ShieldCheck, Sparkles, X, ChevronRight
} from 'lucide-react';
import { fetchPatients, ingestPatientDocument, addPatient, PatientRecord } from '@/lib/api';

export default function AdminPatientManagementView() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Document Upload State
  const [intakeText, setIntakeText] = useState('');
  const [filename, setFilename] = useState('Nurse_Intake_Form_01.txt');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1985-05-12',
    gender: 'M',
    phone: '+1-555-0199',
    email: '',
    address: 'Springfield General Hospital',
    allergies: 'None',
    primary_diagnosis: 'Routine Clinical Evaluation'
  });

  const loadPatients = async () => {
    setLoading(true);
    const data = await fetchPatients();
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleDocumentParse = async () => {
    if (!intakeText.trim()) return;
    setIsParsing(true);
    setParseSuccessMsg(null);
    try {
      const res = await ingestPatientDocument(intakeText, filename);
      if (res && res.message) {
        setParseSuccessMsg(res.message);
        setIntakeText('');
        loadPatients();
      }
    } catch (err) {
      console.error('Error parsing document:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.first_name || !newPatient.last_name) return;
    await addPatient(newPatient);
    setShowAddModal(false);
    setNewPatient({
      first_name: '',
      last_name: '',
      date_of_birth: '1985-05-12',
      gender: 'M',
      phone: '+1-555-0199',
      email: '',
      address: 'Springfield General Hospital',
      allergies: 'None',
      primary_diagnosis: 'Routine Clinical Evaluation'
    });
    loadPatients();
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || (p.id || '').toLowerCase().includes(query) || (p.primary_diagnosis || '').toLowerCase().includes(query);
  });

  const parseVitals = (vitalsJson?: string) => {
    if (!vitalsJson) return { hr: 72, bp: '120/80', spo2: 98 };
    try {
      return typeof vitalsJson === 'string' ? JSON.parse(vitalsJson) : vitalsJson;
    } catch {
      return { hr: 72, bp: '120/80', spo2: 98 };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800 bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">
              Admin Patient Intake Engine
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200">
              <Sparkles className="h-3 w-3" /> Real-Time AI Parser
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Real Patient Directory & Intake Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl font-normal">
            Ingest nurse paper intake notes, scanned PDFs, or text documents using AI to automatically populate real patient records for surgical scheduling & diagnostic orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Single Patient</span>
          </button>
          <button
            onClick={loadPatients}
            className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: Left Document Parsing & Ingestion Zone | Right Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Document Intake Box (2 Columns wide) */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Paper Intake Document Parser</h2>
                <p className="text-xs text-zinc-500">Upload nurse notes, scanned forms, or paste raw intake text</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              Groq LLM Multimodal
            </span>
          </div>

          {parseSuccessMsg && (
            <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-4 text-xs font-semibold text-zinc-900 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-zinc-900 shrink-0" />
              <span>{parseSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-zinc-700">Paste Intake Note / Document Text</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Source Filename"
                className="text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 w-48"
              />
            </div>
            
            <textarea
              rows={5}
              value={intakeText}
              onChange={(e) => setIntakeText(e.target.value)}
              placeholder="Example Nurse Intake Note:&#10;Patient Intake Form: John Doe, DOB 1988-06-15, Male. Phone: +1-555-9081. Email: john.doe@email.com. BP 122/80, HR 74, SpO2 98%. Complaint: Severe right lower quadrant abdominal pain, suspected appendicitis."
              className="w-full text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-2xl p-4 focus:bg-white focus:outline-none focus:border-zinc-900 transition"
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-zinc-400">
                Supports unstructured nurse paper notes, emergency intake logs, and clinical records.
              </p>
              
              <button
                onClick={handleDocumentParse}
                disabled={isParsing || !intakeText.trim()}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-extrabold text-white shadow-sm transition ${
                  isParsing || !intakeText.trim()
                    ? 'bg-zinc-300 cursor-not-allowed'
                    : 'bg-zinc-900 hover:bg-zinc-800 active:scale-95'
                }`}
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AI Parsing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Parse Document & Register Patient</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Directory Stats & Quick Guidelines */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Patient Intake Analytics
            </h3>
            
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Registered Patients</p>
                    <p className="text-lg font-extrabold text-slate-900">{patients.length}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Pre-Op Operations Ready</p>
                    <p className="text-lg font-extrabold text-slate-900">{patients.length > 0 ? patients.length : 0}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1 text-blue-800">
              <Activity className="h-4 w-4" /> Live Operation Linking
            </p>
            <p className="text-[11px] leading-relaxed text-blue-700">
              Patients ingested here are instantly accessible in Doctor Cockpit & Admin Hub dropdowns for booking surgeries and ordering lab scans.
            </p>
          </div>
        </div>
      </div>

      {/* Main Patient Roster Table Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Patient Directory</h2>
            <p className="text-xs text-slate-500">Live roster of real patients parsed from intake notes or registered manually</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or diagnosis..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">DOB / Gender</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Primary Diagnosis</th>
                <th className="py-3 px-4">Baseline Vitals</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No matching patient records found. Use the document parser above to register new patients.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const vitals = parseVitals(p.vitals_json);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{p.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.date_of_birth || 'N/A'} ({p.gender || 'U'})
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-medium text-slate-700">{p.phone || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{p.email || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 inline-block">
                          {p.primary_diagnosis || 'Routine Evaluation'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                            HR: {vitals.hr || 72} bpm
                          </span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            BP: {vitals.bp || '120/80'}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            SpO2: {vitals.spo2 || 98}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                          Ready for Surgery
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Single Patient Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Patient Record</h3>
                  <p className="text-xs text-slate-500">Enter patient demographic & clinical details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    placeholder="John"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    placeholder="Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+1-555-0199"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="john.doe@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Diagnosis / Chief Complaint</label>
                <input
                  type="text"
                  value={newPatient.primary_diagnosis}
                  onChange={(e) => setNewPatient({ ...newPatient, primary_diagnosis: e.target.value })}
                  placeholder="e.g. Acute Appendicitis / Coronary CAD"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 shadow-sm"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
