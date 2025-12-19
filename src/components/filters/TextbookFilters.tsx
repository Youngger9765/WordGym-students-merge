import React, { useMemo } from 'react';
import { TextbookIndexItem } from '../../types';
import { useUserSettings } from '../../hooks/useUserSettings';
import { VersionService } from '../../services/VersionService';

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
    if (!userSettings?.version || !userSettings.stage) return [];

    // Strict version matching with VersionService
    const filtered = dataset.textbook_index.filter(item => {
      const normalizedItemVersion = VersionService.normalizeWithGuard(item.version);
      const normalizedUserVersion = VersionService.normalizeWithGuard(userSettings.version);
      return normalizedItemVersion === normalizedUserVersion;
    });

    const vols = Array.from(
      new Set(filtered.map(item => item.vol).filter(Boolean))
    ).sort();

    return vols;
  }, [dataset.textbook_index, userSettings?.version, userSettings?.stage]);

  const availableLessons = useMemo(() => {
    if (!userSettings?.version || !userSettings.stage || availableVols.length === 0) return [];

    const normalizedUserVersion = VersionService.normalizeWithGuard(userSettings.version);

    return Array.from(
      new Set(
        dataset.textbook_index
          .filter(
            item =>
              VersionService.normalizeWithGuard(item.version) === normalizedUserVersion &&
              item.vol === (filters.vol || availableVols[0])
          )
          .map(item => item.lesson)
          .filter(Boolean)
      )
    ).sort();
  }, [dataset.textbook_index, userSettings?.version, userSettings?.stage, filters.vol, availableVols]);

  // Show message if no data available
  if (availableVols.length === 0) {
    return (
      <div className="mb-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800 font-medium mb-1">課本進度資料尚未建立</p>
        <p className="text-xs text-yellow-700">
          目前 Google Sheet 中「{userSettings?.version}」版本的課本進度資料尚未填入。
          請聯繫管理員或切換至「大考衝刺」或「主題探索」模式。
        </p>
      </div>
    );
  }

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