'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RoleDoctorView from '@/components/RoleDoctorView';
import { fetchClaims, Claim } from '@/lib/api';

import DemoAgenticControlBar from '@/components/DemoAgenticControlBar';

export default function DoctorPage() {
  const [claims, setClaims] = useState<Claim[]>([]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Navbar userRole="DOCTOR" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RoleDoctorView
          claims={claims}
          onRefresh={loadData}
        />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500 font-mono tracking-wider uppercase">
        <p>Doctor Portal • Surgery Readiness & Pre-Op Clinical Clearance • HL7 FHIR Governance</p>
      </footer>

      {/* Noukha Agents Intelligence Layer Floating Demo Control Bar */}
      <DemoAgenticControlBar />
    </div>
  );
}

