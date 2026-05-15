'use client';

import { useState, useEffect } from 'react';
import EtheralShadow from './EtheralShadow';

export default function EtheralBackground() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <EtheralShadow
        color="rgba(100, 100, 115, 1)"
        animation={{ scale: 50, speed: 95 }}
        noise={{ opacity: 0.4, scale: 1.2 }}
      />
    </div>
  );
}
