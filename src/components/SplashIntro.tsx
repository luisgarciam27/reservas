import React, { useEffect, useState } from 'react';
import { MariaLogoMark } from './RubroIcons';

export const SplashIntro: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const quickTimer = setTimeout(() => setVisible(false), 180);
      return () => clearTimeout(quickTimer);
    }

    const fadeTimer = setTimeout(() => setFading(true), 420);
    const hideTimer = setTimeout(() => setVisible(false), 640);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-200 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <MariaLogoMark className="w-16 h-16 shadow-xl shadow-indigo-500/30 animate-pulse" />
        <div>
          <p className="text-xl font-bold tracking-tight text-white">
            MarIA Reservas
          </p>
          <p className="mt-1 text-xs font-medium text-indigo-300">
            Huancayo · Inteligencia y WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
};
