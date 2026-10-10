'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RolePatientView from '@/components/RolePatientView';
import VoiceInterfaceModal from '@/components/VoiceInterfaceModal';
import DemoAgenticControlBar from '@/components/DemoAgenticControlBar';
import { fetchClaims, Claim } from '@/lib/api';

export default function PatientPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>('CLM001');

  const loadData = async () => {
    try {
      const data = await fetchClaims();
      setClaims(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenVoiceModal = (workflowOrClaimId: string) => {
    setActiveWorkflowId(workflowOrClaimId);
    setIsVoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Navbar userRole="PATIENT" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RolePatientView
          claims={claims}
          onOpenVoiceModal={handleOpenVoiceModal}
        />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500 font-mono tracking-wider uppercase">
        <p>Patient Portal • Personal Healthcare Claims & Interactive Voice Call • HL7 FHIR Governance</p>
      </footer>

      <VoiceInterfaceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        workflowId={activeWorkflowId}
      />

      <DemoAgenticControlBar />
    </div>
  );
}
