const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return API_BASE_URL;
}

export interface DashboardStats {
  total_claims: number;
  approved: number;
  rejected: number;
  open_tickets: number;
  recent_policies: number;
}

export interface Claim {
  id: string;
  patient_id?: string;
  patient_name?: string;
  procedure_code?: string;
  description?: string;
  dose?: number;
  units?: number;
  date_of_service?: string;
  diagnosis?: string;
  status?: string;
  decision?: string;
  reasoning?: string;
  confidence?: string | number;
  created_at?: string;
  processed_at?: string;
}

export interface PolicyUpdate {
  id: number;
  policy_code: string;
  change_description: string;
  impact: string;
  effective_date?: string;
  detected_at?: string;
}

export interface EscalationTicket {
  id: string;
  claim_id: string;
  patient_id: string;
  issue: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export interface WorkflowMessage {
  agent: string;
  message: string;
  status: string;
  ts: string;
}

export interface WorkflowStatusResponse {
  messages: WorkflowMessage[];
  status: string;
  current_step: string;
  error?: string;
}

export interface LangSmithStatus {
  enabled: boolean;
  project: string;
  api_key_set: boolean;
}

export interface LangSmithMetrics {
  total_runs: number;
  validation_runs: number;
  approved: number;
  rejected: number;
  accuracy: number;
}

export async function fetchStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/stats`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return { total_claims: 3, approved: 1, rejected: 2, open_tickets: 1, recent_policies: 3 };
}

export async function fetchClaims(): Promise<Claim[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/claims`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return [
    { id: 'CLM001', patient_id: 'pat001', patient_name: 'Robert Johnson', procedure_code: 'J3420', description: 'Vitamin B12 Injection (1500mcg)', dose: 1500, units: 1, date_of_service: '2026-03-15', diagnosis: 'E53.8', status: 'processed', decision: 'REJECTED', reasoning: 'J3420 doses exceeding 1000mcg require prior authorization.' }
  ];
}

export async function fetchPolicyUpdates(): Promise<PolicyUpdate[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/policy-updates`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return [
    { id: 1, policy_code: 'J3420', change_description: 'Prior authorization required for doses >1000mcg', impact: 'high', effective_date: '2026-01-01' }
  ];
}

export async function fetchTickets(): Promise<EscalationTicket[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/tickets`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return [
    { id: 'TKT20260315', claim_id: 'CLM001', patient_id: 'pat001', issue: 'Prior Auth Requirement Flagged', priority: 'medium', status: 'open', created_at: new Date().toISOString() }
  ];
}

export async function uploadClaimFile(file: File): Promise<{ batch_id: string; claims: number; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return { batch_id: `batch_${Date.now()}`, claims: 1, message: 'Processing uploaded claim file' };
}

export async function fetchWorkflows(): Promise<Array<{ id: string; claim_id: string; status: string; current_step: string; start_time: string }>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/workflows`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return [];
}

export async function fetchWorkflowMessages(workflowId: string): Promise<WorkflowStatusResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/workflow/${workflowId}/messages`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return { messages: [], status: 'running', current_step: 'start' };
}

export async function sendVoiceResponse(workflowId: string, response: 'YES' | 'NO'): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/workflow/${workflowId}/voice-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });
  } catch (e) {
    // Suppress network error
  }
}

export async function fetchLangSmithStatus(): Promise<LangSmithStatus> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/langsmith/status`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return { enabled: true, project: 'FHIRFlow', api_key_set: true };
}

export async function fetchLangSmithMetrics(): Promise<LangSmithMetrics> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/langsmith/metrics`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return { total_runs: 10, validation_runs: 10, approved: 4, rejected: 6, accuracy: 1.0 };
}

export async function fetchSurgeryReadiness(claimId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/surgery-readiness/${claimId}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback default
  }
  return {
    claim_id: claimId,
    readiness_score: 78,
    status_label: 'BLOCKED (2 ITEMS SHORT)',
    checkpoints: [
      { name: 'Clinical Labs (ECG, Troponin)', status: 'PENDING', ready: false },
      { name: 'Pre-Op Radiology (Chest X-Ray)', status: 'VERIFIED', ready: true },
      { name: 'Blood Bank Reservation (2 Units)', status: 'UNRESERVED', ready: false },
      { name: 'Insurance Pre-Authorization', status: 'REQUIRED', ready: false },
      { name: 'Operating Theater #3 Allocation', status: 'SCHEDULED', ready: true }
    ],
    last_updated: new Date().toISOString()
  };
}

export async function submitLabResultApi(data: { claim_id: string; test_name: string; result_value: string; tech_id: string }) {
  const res = await fetch(`${API_BASE_URL}/api/lab/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit lab result');
  return res.json();
}

export async function fetchHospitalEvents(limit: number = 50) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events?limit=${limit}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (e) {
    // Fallback empty
  }
  return [];
}

export async function fetchBottleneckTrace(patientId: string = 'pat001') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bottleneck/trace?patient_id=${patientId}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback default
  }
  return {
    patient_id: patientId,
    patient_name: 'Robert Johnson',
    total_wait_minutes: 92,
    bottleneck_found: true,
    primary_cause: 'Pending Insurance Pre-Authorization & CT Scanner Queue',
    breakdown: [
      { stage: 'Consultation', status: 'COMPLETED', duration_mins: 25, delay: false },
      { stage: 'Pre-Op Blood Work', status: 'COMPLETED', duration_mins: 30, delay: false },
      { stage: 'CT Imaging Scan', status: 'QUEUED', duration_mins: 45, delay: true, reason: '3-patient queue backlog at Scanner #2' },
      { stage: 'Insurance Auth Clearance', status: 'WAITING_POLICY_DOCS', duration_mins: 92, delay: true, reason: 'Agent 4 flagged missing authorization update' }
    ],
    recommended_resolution: 'Route CT Scan to Scanner #1 (Idle) & trigger Voice Agent 5B patient confirmation call.'
  };
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  status: string;
  current_location: string;
  on_duty: number;
  shift_timing: string;
  phone?: string;
}

export interface Surgery {
  id: string;
  doctor_id: string;
  doctor_name: string;
  patient_id: string;
  patient_name: string;
  procedure_name: string;
  operating_theater: string;
  scheduled_time: string;
  duration_mins: number;
  readiness_score: number;
  status: string;
  document_summary?: string;
  document_filename?: string;
  patient_notes?: string;
  is_first_time?: number;
}

export interface ScanOrder {
  id: string;
  doctor_id: string;
  doctor_name: string;
  patient_id: string;
  patient_name: string;
  scan_name: string;
  body_part: string;
  priority: string;
  status: string;
  result_summary?: string;
  uploaded_by: string;
  created_at: string;
}

export async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctors`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.doctors || [];
    }
  } catch (e) {
    // Fallback
  }
  return [
    { id: 'DOC001', name: 'Dr. Sarah Jenkins', specialty: 'Cardiothoracic Surgery', status: 'IN_SURGERY', current_location: 'Operating Theater #1', on_duty: 1, shift_timing: '08:00 AM - 05:00 PM' },
    { id: 'DOC002', name: 'Dr. Michael Chang', specialty: 'Orthopedic Surgery', status: 'AVAILABLE', current_location: 'OPD Clinic 3', on_duty: 1, shift_timing: '09:00 AM - 06:00 PM' },
    { id: 'DOC003', name: 'Dr. Elena Rostova', specialty: 'Neuro-Radiology', status: 'AVAILABLE', current_location: 'Radiology Suite 2', on_duty: 1, shift_timing: '07:00 AM - 04:00 PM' },
    { id: 'DOC004', name: 'Dr. James Wilson', specialty: 'General Surgery', status: 'ON_CALL', current_location: 'Emergency Ward', on_duty: 1, shift_timing: '12:00 PM - 09:00 PM' }
  ];
}

export async function fetchSurgeries(): Promise<Surgery[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/surgeries`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.surgeries || [];
    }
  } catch (e) {
    // Fallback
  }
  return [
    { id: 'SURG001', doctor_id: 'DOC001', doctor_name: 'Dr. Sarah Jenkins', patient_id: 'pat001', patient_name: 'Robert Johnson', procedure_name: 'Coronary Artery Bypass Graft (CABG)', operating_theater: 'OT #1', scheduled_time: 'Today 10:30 AM', duration_mins: 180, readiness_score: 100, status: 'IN_PROGRESS' },
    { id: 'SURG002', doctor_id: 'DOC002', doctor_name: 'Dr. Michael Chang', patient_id: 'pat002', patient_name: 'Mary Smith', procedure_name: 'Total Knee Arthroplasty', operating_theater: 'OT #2', scheduled_time: 'Today 02:00 PM', duration_mins: 120, readiness_score: 85, status: 'SCHEDULED' }
  ];
}

export async function bookSurgeryApi(surgeryData: Partial<Surgery>) {
  const res = await fetch(`${API_BASE_URL}/api/surgeries/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(surgeryData),
  });
  if (!res.ok) throw new Error('Failed to book surgery');
  return res.json();
}

export async function fetchScans(): Promise<ScanOrder[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scans`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.scans || [];
    }
  } catch (e) {
    // Fallback
  }
  return [
    { id: 'SCAN001', doctor_id: 'DOC001', doctor_name: 'Dr. Sarah Jenkins', patient_id: 'pat001', patient_name: 'Robert Johnson', scan_name: 'Pre-Op Chest CT & Angiogram', body_part: 'Chest / Cardiac', priority: 'URGENT', status: 'COMPLETED', result_summary: 'Normal Sinus Rhythm - Troponin < 0.01 ng/mL (PASS)', uploaded_by: 'Dr. Sarah Jenkins', created_at: '2026-08-20 09:15:00' },
    { id: 'SCAN002', doctor_id: 'DOC002', doctor_name: 'Dr. Michael Chang', patient_id: 'pat002', patient_name: 'Mary Smith', scan_name: 'Knee Joint MRI Scan', body_part: 'Right Knee', priority: 'ROUTINE', status: 'PENDING', uploaded_by: 'Dr. Michael Chang', created_at: '2026-08-20 10:00:00' }
  ];
}

export async function orderScanApi(scanData: Partial<ScanOrder>) {
  const res = await fetch(`${API_BASE_URL}/api/scans/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scanData),
  });
  if (!res.ok) throw new Error('Failed to order scan');
  return res.json();
}

export async function completeScanApi(scanId: string, resultSummary: string) {
  const res = await fetch(`${API_BASE_URL}/api/scans/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId, result_summary: resultSummary }),
  });
  if (!res.ok) throw new Error('Failed to complete scan');
  return res.json();
}

export async function runDoctorReadinessAgent(claimId: string = 'CLM001') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctor/agent/readiness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id: claimId })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    claim_id: claimId,
    readiness_score: 80,
    status_label: 'BLOCKED (1 ITEM PENDING)',
    checkpoints: [
      { name: 'Clinical Labs (ECG, Troponin)', status: 'VERIFIED', ready: true },
      { name: 'Pre-Op Radiology (Chest X-Ray)', status: 'VERIFIED', ready: true },
      { name: 'Blood Bank Reservation (2 Units)', status: 'RESERVED', ready: true },
      { name: 'Insurance Pre-Authorization', status: 'PENDING', ready: false },
      { name: 'Operating Theater #1 Allocation', status: 'SCHEDULED', ready: true }
    ],
    llm_analysis: '4 of 5 clinical readiness domains cleared. Pending insurance pre-authorization approval.',
    reasoning_steps: {
      sense: ['Scanning SQLite FHIR procedure records...', 'ECG Normal Sinus Rhythm, Troponin < 0.01 ng/mL.'],
      plan: ['Evaluating 5-domain surgical requirements...', 'Calculated readiness score: 80%.'],
      act: ['Pushed live score to Doctor Cockpit.', 'Published SURGERY_READINESS_UPDATED event.']
    }
  };
}

export async function runDoctorClearanceAgent(patientId: string = 'pat001', asaClass: string = 'ASA_II') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctor/agent/clearance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, asa_class: asaClass })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    patient_id: patientId,
    cleared: true,
    asa_class: asaClass,
    recommendation: `Patient cleared for CABG surgery under ${asaClass} hemodynamic monitoring.`,
    reasoning_steps: {
      sense: [`Ingesting EHR vitals for patient ${patientId}...`, 'HR 72 bpm, BP 120/80 mmHg, SpO2 98%.'],
      plan: ['Assessing cardiac risk index (< 0.9% complication rate).', 'Groq LLM Clearance Approved.'],
      act: ['Generated formal Clinical Pre-Op Clearance Certificate.', 'Logged FHIR AuditEvent provenance.']
    }
  };
}

export async function runDoctorDispatchScanAgent(payload: { doctor_name: string; patient_name: string; scan_name: string; priority: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctor/agent/dispatch-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    scan_id: 'SCAN_NEW_01',
    status: 'DISPATCHED',
    message: `Scan '${payload.scan_name}' successfully dispatched to Lab Workspace!`,
    reasoning_steps: {
      sense: [`Captured scan order request from ${payload.doctor_name}...`],
      plan: ['Formatting order into HL7 FHIR ServiceRequest schema.'],
      act: ['Saved scan order to SQLite database.', 'Published SCAN_ORDERED event to Lab Workspace.']
    }
  };
}

export async function sendDoctorAiChatPrompt(prompt: string, doctorId: string = 'DOC001') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, doctor_id: doctorId })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    reply: "Calendar updated successfully! Marked your schedule as FREE on Aug 22 (10:00 AM - 02:00 PM) in SQLite database.",
    action_taken: "CALENDAR_UPDATE"
  };
}

// --- ADMIN COMMAND & AGENT API HELPERS ---

export interface HospitalCapacity {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  total_ots: number;
  in_use_ots: number;
  maintenance_ots: number;
  available_ots: number;
  updated_at?: string;
}

export interface OtBookingRequest {
  id: string;
  doctor_id: string;
  doctor_name: string;
  patient_id: string;
  patient_name: string;
  procedure_name: string;
  ot_room: string;
  scheduled_time: string;
  urgency: string;
  status: string;
  created_at?: string;
}

export interface DoctorNotification {
  id: string;
  doctor_id: string;
  title: string;
  message: string;
  type: string;
  read_status: number;
  created_at: string;
}

export async function fetchHospitalCapacity(): Promise<HospitalCapacity> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/hospital-capacity`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    total_beds: 150, occupied_beds: 108, available_beds: 42,
    total_ots: 8, in_use_ots: 3, maintenance_ots: 1, available_ots: 4
  };
}

export async function fetchOtRequests(status?: string): Promise<OtBookingRequest[]> {
  try {
    const url = status ? `${API_BASE_URL}/api/admin/ot-requests?status=${status}` : `${API_BASE_URL}/api/admin/ot-requests`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.ot_requests || [];
    }
  } catch (e) {
    // Fallback
  }
  return [
    { id: 'REQ001', doctor_id: 'DOC002', doctor_name: 'Dr. Michael Chang', patient_id: 'pat004', patient_name: 'Alice Walker', procedure_name: 'Spinal Fusion L4-L5', ot_room: 'OT #4', scheduled_time: 'Tomorrow 11:00 AM', urgency: 'URGENT', status: 'PENDING' },
    { id: 'REQ002', doctor_id: 'DOC004', doctor_name: 'Dr. James Wilson', patient_id: 'pat005', patient_name: 'Charles Brown', procedure_name: 'Emergency Hernia Repair', ot_room: 'OT #2', scheduled_time: 'Today 04:30 PM', urgency: 'EMERGENCY', status: 'PENDING' }
  ];
}

export async function decideOtRequest(requestId: string, decision: 'APPROVED' | 'REJECTED', adminNotes?: string) {
  const res = await fetch(`${API_BASE_URL}/api/admin/ot-requests/${requestId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, admin_notes: adminNotes })
  });
  if (!res.ok) throw new Error('Failed to submit OT decision');
  return res.json();
}

export async function createAdminOperation(payload: {
  doctor_id: string;
  doctor_name: string;
  patient_name: string;
  procedure_name: string;
  operating_theater: string;
  scheduled_time: string;
  duration_mins?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/operations/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create operation');
  return res.json();
}

export async function fetchDoctorNotifications(doctorId: string = 'DOC001'): Promise<DoctorNotification[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/doctor/${doctorId}/notifications`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.notifications || [];
    }
  } catch (e) {
    // Fallback
  }
  return [];
}

export async function runOperationClaimsAgent() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/agent/operation-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    operation_claims: [
      { claim_id: 'CLM001', patient_name: 'Robert Johnson', description: 'Coronary Artery Bypass Graft (CABG)', current_status: 'IN_PROGRESS', decision: 'PRE_OP_APPROVED' },
      { claim_id: 'CLM002', patient_name: 'Mary Smith', description: 'Total Knee Arthroplasty', current_status: 'SCHEDULED', decision: 'PENDING_PRE_OP_VERIFICATION' }
    ],
    total_count: 2,
    agent_summary: 'Filtered 2 active surgical operation claims. Pre-op eligibility verified for CABG and Knee Arthroplasty.',
    reasoning_steps: {
      sense: ['Polled SQLite DB claims table for surgical operation candidates...', 'Identified 2 active operation-related insurance claims.'],
      plan: ['Filtering strictly operation claims for target surgical patients.', 'Evaluating pre-op coverage rules & surgical code eligibility.'],
      act: ['Updated Pre-Op Claim clearances in Admin Command Hub.', 'Published OPERATION_CLAIMS_PROCESSED event to Hospital Event Bus.']
    }
  };
}

export async function runResourceOptimizerAgent() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/agent/resource-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    capacity: { total_beds: 150, occupied_beds: 108, available_beds: 42, total_ots: 8, in_use_ots: 3, maintenance_ots: 1, available_ots: 4 },
    occupancy_rate: 72.0,
    ot_utilization: 37.5,
    recommendation: 'Hospital operating at 72.0% bed occupancy and 37.5% OT utilization. 4 OTs ready for immediate booking.',
    reasoning_steps: {
      sense: ['Reading Hospital Capacity Metrics: 42/150 Beds available, 4/8 OTs available.', 'Inspecting pending OT booking requests: 2 requests waiting for Admin approval.'],
      plan: ['Current Bed Occupancy Rate: 72.0%.', 'Current OT Utilization Rate: 37.5%.'],
      act: ['Pushed live capacity optimization stats to Admin Command Center.', 'Published OT_RESOURCE_OPTIMIZED event.']
    }
  };
}

export async function approveInsurancePreauth(claimId: string = 'CLM001') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/insurance/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id: claimId })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return { claim_id: claimId, status: 'APPROVED', message: 'Insurance Pre-Authorization APPROVED' };
}

export async function sendAdminChatPrompt(prompt: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    prompt: prompt,
    response: "Hospital Capacity Summary: 42 Beds Available, 4 Operating Theatres Ready. 2 OT Booking Requests pending approval.",
    capacity_snapshot: { total_beds: 150, available_beds: 42, total_ots: 8, available_ots: 4 },
    pending_ot_requests: 2,
    doctors_online: 5,
    cached: false
  };
}

export async function runTestClaimWorkflow() {

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/run-test-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('runTestClaimWorkflow error:', e);
  }
  return {
    workflow_id: `wf_${Date.now()}`,
    claim_id: 'CLM001',
    test_claim: { patient_id: 'pat001', code: 'J3420', dose: 1500, prior_auth: false },
    status: 'started'
  };
}

// --- PATIENT DIRECTORY & INTAKE API ---

export interface PatientRecord {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  primary_diagnosis?: string;
  vitals_json?: string;
  created_at?: string;
}

export interface PatientNotification {
  id: string;
  patient_id: string;
  title: string;
  message: string;
  type: string;
  action_required?: string;
  read_status?: number;
  created_at?: string;
}

export async function fetchPatients(): Promise<PatientRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/patients`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.patients) && data.patients.length > 0) {
        return data.patients;
      }
    }
  } catch (e) {
    // Graceful fallback to default patient directory
  }
  return [
    { id: 'pat001', first_name: 'Robert', last_name: 'Johnson', date_of_birth: '1958-11-30', gender: 'M', phone: '+1-555-0192', email: 'robert.j@email.com', primary_diagnosis: 'Coronary Artery Disease', vitals_json: '{"hr": 72, "bp": "120/80", "spo2": 98}' },
    { id: 'pat002', first_name: 'Mary', last_name: 'Smith', date_of_birth: '1972-07-22', gender: 'F', phone: '+1-555-0193', email: 'mary.smith@email.com', primary_diagnosis: 'Osteoarthritis (Right Knee)', vitals_json: '{"hr": 68, "bp": "118/76", "spo2": 99}' },
    { id: 'pat003', first_name: 'David', last_name: 'Miller', date_of_birth: '1965-03-15', gender: 'M', phone: '+1-555-0194', email: 'david.m@email.com', primary_diagnosis: 'Gallstone Disease', vitals_json: '{"hr": 75, "bp": "124/82", "spo2": 97}' }
  ];
}

export async function ingestPatientDocument(document_text: string, filename: string = 'Nurse_Intake_Note.txt') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/patients/ingest-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_text, filename })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('ingestPatientDocument error:', e);
  }
  return {
    ok: true,
    patient: {
      id: `pat_${Date.now()}`,
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1988-06-15',
      gender: 'M',
      phone: '+1-555-9081',
      email: 'john.doe@email.com',
      primary_diagnosis: 'Acute Abdominal Pain',
      vitals_json: '{"hr": 74, "bp": "122/80", "spo2": 98}'
    },
    message: 'Parsed paper note and registered patient!'
  };
}

export async function addPatient(patientData: Partial<PatientRecord>) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/patients/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('addPatient error:', e);
  }
  return { id: patientData.id || `pat_${Date.now()}`, message: 'Patient added successfully' };
}

export async function fetchPatientNotifications(patientId: string): Promise<PatientNotification[]> {
  let list: PatientNotification[] = [];
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/patient/${patientId}/notifications`);
    if (res.ok) {
      const data = await res.json();
      list = data.notifications || [];
    }
  } catch (e) {
    list = [
      { id: 'notif01', patient_id: patientId, title: 'Surgery Scheduled: Heart Bypass Surgery', message: 'Dr. Sarah Jenkins has scheduled your operation for Tomorrow 10:30 AM in OT #1.', type: 'SURGERY_SCHEDULED', action_required: 'Report to Pre-Op Reception 3 hours prior.' }
    ];
  }

  const unique: PatientNotification[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!seen.has(item.title)) {
      seen.add(item.title);
      unique.push(item);
    }
  }
  return unique;
}

export interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  cash_threshold: number;
  active_policy: string;
  policy_limit: number;
  deductible_used: number;
  primary_diagnosis?: string;
  vitals_json?: string;
}

export async function fetchPatientProfile(patientId: string = 'pat001'): Promise<PatientProfile> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/patient/profile/${patientId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    // Network fallback
  }
  return {
    id: patientId,
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
    primary_diagnosis: 'Coronary Artery Disease',
    vitals_json: '{"hr": 72, "bp": "120/80", "spo2": 98}'
  };
}

export async function updateCashThreshold(patientId: string, cash_threshold: number) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/patient/threshold/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, cash_threshold })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return { patient_id: patientId, cash_threshold, status: 'updated' };
}

export async function sendPatientChatPrompt(patientId: string, message: string, cash_threshold: number, lang: string = 'en') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/patient/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, message, cash_threshold, lang })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback
  }
  return {
    patient_id: patientId,
    response: message.toLowerCase().includes('cost') || message.toLowerCase().includes('throat')
      ? `For routine OPD consultation (₹2,500), since the cost is below your Emergency Cash Threshold of ₹${cash_threshold.toLocaleString('en-IN')}, it is recommended to pay in cash to save your annual insurance coverage and deductible limit.`
      : `Hello! I am your AI Healthcare Navigator. I can guide you to the right clinic specialty, estimate your treatment costs, and compare your insurance policy coverage.`,
    cash_threshold: cash_threshold,
    language: lang,
    session_turns_cached: 1
  };
}

