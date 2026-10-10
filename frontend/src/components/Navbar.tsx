'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  userRole?: 'DOCTOR' | 'ADMIN' | 'LAB_TECH' | 'PATIENT' | null;
  userName?: string;
}

export default function Navbar({ userRole, userName }: NavbarProps) {
  const roleTitleMap = {
    DOCTOR: 'Dr. Sarah Jenkins (Chief Surgeon)',
    ADMIN: 'Operations Administrator',
    LAB_TECH: 'Diagnostic Lab Specialist',
    PATIENT: 'Robert Johnson (Patient)'
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white transition-transform group-hover:scale-105 shadow-sm">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-900">Hospital-OS</span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 border border-zinc-200 tracking-wider uppercase">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium hidden sm:block">Agentic Hospital Operating System</p>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          {userRole ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <UserCheck className="h-3.5 w-3.5 text-zinc-600" />
                <span>{userName || roleTitleMap[userRole]}</span>
              </div>

              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <LogOut className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sign Out</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition active:scale-95"
            >
              <span>Sign In to Portals</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
