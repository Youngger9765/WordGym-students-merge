import React from 'react';
import { POSType, POS_LABEL } from '../../types';
import { useQuickFilterPos } from '../../hooks/useQuickFilterPos';

export const QuickPOSFilter: React.FC = () => {
  const { quickFilterPos, setQuickFilterPos } = useQuickFilterPos();

  const handlePOSFilter = (pos: POSType | 'all') => {
    console.log('🖱️ QuickPOSFilter clicked:', pos);
    console.log('  - Current quickFilterPos:', quickFilterPos);
    setQuickFilterPos(pos);
    console.log('  - After setQuickFilterPos:', pos);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        key="all"
        onClick={() => handlePOSFilter('all')}
        className={`px-4 py-2 text-sm font-medium rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          quickFilterPos === 'all'
            ? 'bg-[#5A4FCF] text-white border-[#5A4FCF] shadow-sm'
            : 'bg-white text-gray-700 border-[#E2E8F0] hover:bg-indigo-50 hover:text-[#5A4FCF]'
        } hover:opacity-95 focus:ring-[#5A4FCF]/30`}
        type="button"
      >
        全部
      </button>
      {Object.entries(POS_LABEL).map(([pos, label]) => (
        <button
          key={pos}
          onClick={() => handlePOSFilter(pos as POSType)}
          className={`px-4 py-2 text-sm font-medium rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            quickFilterPos === pos
              ? 'bg-[#5A4FCF] text-white border-[#5A4FCF] shadow-sm'
              : 'bg-white text-gray-700 border-[#E2E8F0] hover:bg-indigo-50 hover:text-[#5A4FCF]'
          } hover:opacity-95 focus:ring-[#5A4FCF]/30`}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
};