import React, { useMemo } from 'react';
import { TextbookIndexItem } from '../../types';
import { useUserSettings } from '../../hooks/useUserSettings';

interface TextbookFiltersProps {
  filters: {
    vol?: string;
    lesson?: string;
  };
  updateFilter: (key: 'vol' | 'lesson', value: string) => void;
  dataset: { textbook_index: TextbookIndexItem[] };
}

export const TextbookFilters: React.FC<TextbookFiltersProps> = ({
  filters,
  updateFilter,
  dataset
}) => {
  const { userSettings } = useUserSettings();

  const availableVols = useMemo(() => {
    if (!userSettings) return [];
    return Array.from(
      new Set(
        dataset.textbook_index
          .filter(item => item.version === userSettings.version)
          .map(item => item.vol)
      )
    ).sort();
  }, [dataset.textbook_index, userSettings]);

  const availableLessons = useMemo(() => {
    if (!userSettings) return [];
    return Array.from(
      new Set(
        dataset.textbook_index
          .filter(
            item =>
              item.version === userSettings.version &&
              item.vol === filters.vol
          )
          .map(item => item.lesson)
      )
    ).sort();
  }, [dataset.textbook_index, userSettings, filters.vol]);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          冊次
        </label>
        <select
          value={filters.vol || availableVols[0]}
          onChange={(e) => updateFilter('vol', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
        >
          {availableVols.map(vol => (
            <option key={vol} value={vol}>{vol}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          課次
        </label>
        <select
          value={filters.lesson || availableLessons[0]}
          onChange={(e) => updateFilter('lesson', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
        >
          {availableLessons.map(lesson => (
            <option key={lesson} value={lesson}>{lesson}</option>
          ))}
        </select>
      </div>
    </div>
  );
};