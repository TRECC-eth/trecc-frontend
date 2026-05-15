'use client';

import React, { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isNavbarHidden = pathname === '/' || pathname?.startsWith('/dashboard');

  return (
    <>
      {!isNavbarHidden && <Navbar />}
      <main className={`flex-grow flex flex-col ${isNavbarHidden ? '' : 'pt-24'}`}>
        {children}
      </main>
    </>
  );
}
