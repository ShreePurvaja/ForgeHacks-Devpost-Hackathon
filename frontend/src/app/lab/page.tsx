'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import RoleLabView from '@/components/RoleLabView';

export default function LabPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      <Navbar userRole="LAB_TECH" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RoleLabView />
      </main>

      <footer className="border-t border-zinc-200/80 bg-white py-4 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
        <p>Lab Tech Portal • Pre-Op Diagnostic Work Orders & Real-Time Event Sync • HL7 FHIR Governance</p>
      </footer>
    </div>
  );
}
