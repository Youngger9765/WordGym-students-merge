import React, { useMemo } from 'react';
import { TextbookIndexItem } from '../../types';
import { useUserSettings } from '../../hooks/useUserSettings';
import { VersionService } from '../../services/VersionService';

interface TextbookFiltersProps {
  filters: {
    vol?: string;
    lesson?: string[];
  };
  updateFilter: (key: 'vol' | 'lesson', value: string | string[]) => void;
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

  const selectedLessons: string[] = filters.lesson || (availableLessons.length > 0 && availableLessons[0] ? [availableLessons[0]] : []);

  const handleLessonToggle = (lesson: string) => {
    const currentSelection: string[] = Array.isArray(filters.lesson)
      ? filters.lesson.filter((l): l is string => l !== undefined)
      : (availableLessons.length > 0 && availableLessons[0] ? [availableLessons[0]] : []);

    if (currentSelection.includes(lesson)) {
      // Remove lesson if already selected (but keep at least one selected)
      const newSelection = currentSelection.filter(l => l !== lesson);
      if (newSelection.length > 0) {
        updateFilter('lesson', newSelection);
      }
    } else {
      // Add lesson to selection
      updateFilter('lesson', [...currentSelection, lesson]);
    }
  };

  const handleSelectAll = () => {
    if (availableLessons.length > 0) {
      updateFilter('lesson', availableLessons.filter((l): l is string => l !== undefined));
    }
  };

  const handleClearAll = () => {
    if (availableLessons.length > 0 && availableLessons[0]) {
      updateFilter('lesson', [availableLessons[0]]);
    }
  };

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-500">
            課次（可複選）
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              全選
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              清除
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 border border-gray-300 rounded-lg max-h-40 overflow-y-auto min-h-[120px]">
          {availableLessons.length === 0 ? (
            <div className="col-span-3 sm:col-span-4 flex items-center justify-center text-gray-400 text-sm min-h-[96px]">
              {filters.vol ? '載入中...' : '請選擇冊次'}
            </div>
          ) : (
            availableLessons.filter((l): l is string => l !== undefined).map(lesson => (
              <label
                key={lesson}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedLessons.includes(lesson)}
                  onChange={() => handleLessonToggle(lesson)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">{lesson}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};