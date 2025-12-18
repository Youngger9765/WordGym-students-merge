import React, { useMemo } from 'react';
import { ThemeIndexItem } from '../../types';
import { useUserSettings } from '../../hooks/useUserSettings';

interface ThemeFiltersProps {
  filters: {
    range?: string;
    theme?: string;
  };
  updateFilter: (key: 'range' | 'theme', value: string) => void;
  dataset: { theme_index: ThemeIndexItem[] };
}

export const ThemeFilters: React.FC<ThemeFiltersProps> = ({
  filters,
  updateFilter,
  dataset
}) => {
  const { userSettings } = useUserSettings();

  const availableRanges = useMemo(() => {
    if (!userSettings) return [];
    const ranges = userSettings.stage === 'junior'
      ? ['1200', '800']
      : ['4', '5', '6'];
    return ranges;
  }, [userSettings]);

  const availableThemes = useMemo(() => {
    return Array.from(
      new Set(
        dataset.theme_index
          .filter(item =>
            item.range === filters.range ||
            item.range === availableRanges[0]
          )
          .map(item => item.theme)
      )
    ).sort();
  }, [dataset.theme_index, filters.range, availableRanges]);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          {userSettings?.stage === 'junior' ? '2000單' : '程度範圍'}
        </label>
        <select
          value={filters.range || availableRanges[0]}
          onChange={(e) => updateFilter('range', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
        >
          {availableRanges.map(range => (
            <option key={range} value={range}>
              {userSettings?.stage === 'junior'
                ? range
                : `Level ${range}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          主題分類
        </label>
        <select
          value={filters.theme || (availableThemes.length > 0 ? availableThemes[0] : '')}
          onChange={(e) => updateFilter('theme', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
          disabled={availableThemes.length === 0}
        >
          {availableThemes.map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
          {availableThemes.length === 0 && (
            <option value="">無可用主題</option>
          )}
        </select>
      </div>
    </div>
  );
};