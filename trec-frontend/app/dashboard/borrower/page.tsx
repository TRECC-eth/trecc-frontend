'use client';

import React from 'react';
import BorrowerGate from '../../../components/BorrowerGate';
import BorrowerDashboard from '../../../components/BorrowerDashboard';

export default function BorrowerDashboardPage() {
  return (
    <div className="w-full min-h-screen bg-black px-4 pt-36 pb-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <BorrowerGate>
          <BorrowerDashboard />
        </BorrowerGate>
      </div>
    </div>
  );
}
