'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import RoleAdminView from '@/components/RoleAdminView';
import WorkflowModal from '@/components/WorkflowModal';
import { 
  fetchStats, fetchClaims, fetchPolicyUpdates, fetchTickets, fetchWorkflows, 
  DashboardStats, Claim, PolicyUpdate, EscalationTicket, WorkflowMessage, fetchWorkflowMessages 
} from '@/lib/api';

import DemoAgenticControlBar from '@/components/DemoAgenticControlBar';

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<PolicyUpdate[]>([]);
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);

  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeClaimId, setActiveClaimId] = useState<string | null>('CLM001');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowMessages, setWorkflowMessages] = useState<WorkflowMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('Initializing');
  const [workflowStatus, setWorkflowStatus] = useState<string>('pending');

  const loadData = useCallback(async () => {
    try {
      const [sData, cData, pData, tData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchClaims().catch(() => []),
        fetchPolicyUpdates().catch(() => []),
        fetchTickets().catch(() => []),
      ]);
      if (sData) setStats(sData);
      setClaims(cData);
      setPolicies(pData);
      setTickets(tData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live polling for active workflow messages in WorkflowModal
  useEffect(() => {
    if (!activeWorkflowId || !isWorkflowModalOpen) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await fetchWorkflowMessages(activeWorkflowId);
        if (!isMounted) return;

        if (data.messages && data.messages.length > 0) {
          setWorkflowMessages(data.messages);
        }
        if (data.current_step) setCurrentStep(data.current_step);
        if (data.status) setWorkflowStatus(data.status);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          loadData();
        }
      } catch (e) {
        console.error('Error polling workflow status:', e);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeWorkflowId, isWorkflowModalOpen, loadData]);

  const handleUploadSuccess = async () => {
    setTimeout(async () => {
      try {
        const wfs = await fetchWorkflows();
        if (wfs.length > 0) {
          const latest = wfs[0];
          setActiveWorkflowId(latest.id);
          setActiveClaimId(latest.claim_id || latest.id);
          setWorkflowMessages([]);
          setCurrentStep('Initializing');
          setWorkflowStatus('running');
          setIsWorkflowModalOpen(true);
        }
      } catch (e) {
        console.error(e);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      <Navbar userRole="ADMIN" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RoleAdminView
          stats={stats}
          claims={claims}
          policyUpdates={policies}
          tickets={tickets}
          onUploadSuccess={handleUploadSuccess}
          onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
          onRefresh={loadData}
        />
      </main>

      <footer className="border-t border-zinc-200/80 bg-white py-4 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
        <p>Admin Command Center • Bottleneck Intelligence & Master Claims Engine • HL7 FHIR Governance</p>
      </footer>

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        claimId={activeClaimId}
        currentStep={currentStep}
        status={workflowStatus}
        messages={workflowMessages}
      />

      {/* Noukha Agents Intelligence Layer Floating Demo Control Bar */}
      <DemoAgenticControlBar />
    </div>
  );
}

