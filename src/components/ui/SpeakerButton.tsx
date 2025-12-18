import React from 'react';

export interface SpeakerButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  onClick,
  label = 'Speak word',
  className = ''
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M4 9.25v5.5c0 .69.56 1.25 1.25 1.25H7l3.29 2.63c.83.66 2.04.07 2.04-1V6.62c0-1.07-1.21-1.66-2.04-1L7 8.25H5.25C4.56 8.25 4 8.81 4 9.25Zm11.21-2.46a.75.75 0 0 0-.97 1.14 4.5 4.5 0 0 1 0 7.14.75.75 0 0 0 .97 1.14 6 6 0 0 0 0-9.42Zm2.79-1.95a.75.75 0 0 0-.97 1.13 7.5 7.5 0 0 1 0 11.56.75.75 0 0 0 .97 1.13 9 9 0 0 0 0-13.82Z" />
    </svg>
  </button>
);

export default SpeakerButton;