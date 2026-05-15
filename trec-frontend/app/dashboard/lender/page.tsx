'use client';

import React from 'react';
import LenderDashboard from '../../../components/LenderDashboard';

export default function LenderDashboardPage() {
  return (
    <div className="w-full min-h-screen bg-black px-4 pt-36 pb-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <LenderDashboard />
      </div>
    </div>
  );
}
