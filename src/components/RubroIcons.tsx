import React from 'react';
import type { RubroKey } from '../config/rubros';

export const MariaLogoMark: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Cohete MarIA exacto inspirado en la imagen */}
    <path
      d="M32 8C25 8 21 16 21 27V42C21 45.3137 23.6863 48 27 48H37C40.3137 48 43 45.3137 43 42V27C43 16 39 8 32 8Z"
      fill="#7C3AED"
    />
    <path
      d="M32 8C25 8 21 16 21 27H43C43 16 39 8 32 8Z"
      fill="#F43F5E"
    />
    <circle cx="32" cy="27" r="7" fill="#10B981" />
    <circle cx="32" cy="27" r="3" fill="#0F172A" />
    <path d="M21 34L14 40V44L21 41V34Z" fill="#7C3AED" />
    <path d="M43 34L50 40V44L43 41V34Z" fill="#7C3AED" />
    <rect x="26" y="48" width="4" height="6" rx="2" fill="#7C3AED" />
    <rect x="34" y="48" width="4" height="6" rx="2" fill="#7C3AED" />
  </svg>
);

export const RubroSvgIcon: React.FC<{
  rubro: RubroKey;
  className?: string;
}> = ({ rubro, className = 'w-7 h-7' }) => {
  if (rubro === 'consultorio') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M7 3.5C5.2 3.5 4 5.1 4 7.5c0 2.5.9 4.5 1.4 6.9.5 2.5 1 6.1 2.4 6.1 1.2 0 1.7-2.8 2.6-4.5.5-.9 1.1-1.5 1.6-1.5s1.1.6 1.6 1.5c.9 1.7 1.4 4.5 2.6 4.5 1.4 0 1.9-3.6 2.4-6.1.5-2.4 1.4-4.4 1.4-6.9 0-2.4-1.2-4-3-4-1.5 0-2.7.9-3.6 1.5a2.6 2.6 0 0 1-2.8 0C9.7 4.4 8.5 3.5 7 3.5Z" />
      </svg>
    );
  }

  if (rubro === 'salon') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 3c2.4 2.8 3.6 5.4 3.6 8a3.6 3.6 0 1 1-7.2 0c0-2.6 1.2-5.2 3.6-8Z" />
        <path d="M5.5 10.5c2.2.4 4.1 1.6 5.3 3.4a4.2 4.2 0 0 1-5.8 5.6 4.2 4.2 0 0 1 .5-9Z" />
        <path d="M18.5 10.5c-2.2.4-4.1 1.6-5.3 3.4a4.2 4.2 0 0 0 5.8 5.6 4.2 4.2 0 0 0-.5-9Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6.5" cy="9" r="1.8" />
      <circle cx="10.2" cy="5.8" r="1.8" />
      <circle cx="14.2" cy="5.8" r="1.8" />
      <circle cx="17.5" cy="9" r="1.8" />
      <path d="M12 11.2c-2.8 0-5.2 2.2-5.2 4.9 0 1.8 1.3 3 3 3 .9 0 1.5-.4 2.2-.4s1.3.4 2.2.4c1.7 0 3-1.2 3-3 0-2.7-2.4-4.9-5.2-4.9Z" />
    </svg>
  );
};

export const WhatsAppSvgIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.78 14.02c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.14-.97-.32-1.66-.62-2.92-1.26-4.82-4.2-4.97-4.4-.15-.2-1.19-1.58-1.19-3.02 0-1.44.75-2.14 1.02-2.44.27-.3.59-.37.78-.37.2 0 .39.01.56.01.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.44.54-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.64-.08.18-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.49.22.56.34.07.12.07.7-.17 1.38Z" />
  </svg>
);

export const NavCalendarIcon: React.FC<{
  active?: boolean;
  className?: string;
}> = ({ active, className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? '1.6' : '2'}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="17" rx="3" fill="none" />
    <path d="M8 2v4M16 2v4M3 10h18" />
    <path d="M12 13v5M9.5 15.5h5" />
  </svg>
);

export const NavReminderIcon: React.FC<{
  active?: boolean;
  className?: string;
}> = ({ active, className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </svg>
);

export const NavOwnerIcon: React.FC<{
  active?: boolean;
  className?: string;
}> = ({ active, className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
