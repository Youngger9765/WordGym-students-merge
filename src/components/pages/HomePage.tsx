import React, { useState } from 'react';
import { LazyWordCard } from '../cards/LazyWordCard';
import { useCurrentTab } from '../../hooks/useCurrentTab';
import { useTabFilters } from '../../hooks/useTabFilters';
import { useQuickFilterPos } from '../../hooks/useQuickFilterPos';
import { useUserSettings } from '../../hooks/useUserSettings';
import { filterWords } from '../../utils/filterWords';
import type { VocabularyWord } from '../../types';

import { QuickPOSFilter } from '../filters/QuickPOSFilter';
import { TextbookFilters } from '../filters/TextbookFilters';
import { ExamFilters } from '../filters/ExamFilters';
import { ThemeFilters } from '../filters/ThemeFilters';

const TABS = {
  textbook: '課本進度',
  exam: '大考衝刺',
  theme: '主題探索'
};

interface HomePageProps {
  words: VocabularyWord[];
}

export const HomePage: React.FC<HomePageProps> = ({ words }) => {
  const { userSettings } = useUserSettings();
  const { currentTab, setCurrentTab } = useCurrentTab();
  const { filters, updateFilter } = useTabFilters(userSettings);
  const { quickFilterPos } = useQuickFilterPos();

  const [searchTerm, setSearchTerm] = useState('');

  // Show message if no user settings
  if (!userSettings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">請先選擇您的學程和課本版本</p>
      </div>
    );
  }

  const filteredWords = filterWords(
    words,
    userSettings,
    currentTab,
    filters,
    quickFilterPos,
    searchTerm
  );

  const handleTestRange = () => {
    const wordIds = filteredWords.map(word => word.id).join(',');
    window.location.hash = `#/quiz?words=${wordIds}`;
  };

  const handleWordClick = (wordId: number) => {
    window.location.hash = `#/word/${wordId}`;
  };

  const accentColors = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500'];

  return (
    <div className="container mx-auto p-4">
      {/* Welcome Section */}
      <div className="text-gray-600 mb-6 leading-relaxed space-y-1">
        <p className="text-lg font-medium text-gray-500">歡迎來到 WordGym 單字健身坊！</p>
        <p className="text-base text-gray-500">請從課本進度、大考衝刺或主題探索，選擇想要學習的內容！</p>
      </div>

      {/* Tab Navigation - Updated styling to match original */}
      <div className="mb-8 flex flex-wrap gap-4">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCurrentTab(key as 'textbook' | 'exam' | 'theme')}
            className={`flex-1 sm:flex-none text-lg font-bold px-6 py-3 rounded-full border transition-all duration-200 min-h-[52px] ${
              currentTab === key
                ? 'bg-[#5A4FCF] text-white border-transparent shadow-[0_4px_6px_rgba(90,79,207,0.3)]'
                : 'bg-white text-gray-700 border-[#E2E8F0] hover:bg-[#EDF2F7]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic Filters */}
      {currentTab === 'textbook' && (
        <TextbookFilters
          filters={filters.textbook}
          updateFilter={(key, value) => updateFilter('textbook', key, value)}
          dataset={{ textbook_index: words.flatMap(word => word.textbook_index || [])
            .filter((item): item is { version: string; vol: string; lesson: string } => item !== undefined)
            .map(item => ({
              name: `${item.version} Vol ${item.vol} L${item.lesson}`,
              words: [],
              version: item.version,
              vol: item.vol,
              lesson: item.lesson
            })) }}
        />
      )}

      {currentTab === 'exam' && (
        <ExamFilters
          filters={filters.exam}
          updateFilter={(key, value) => updateFilter('exam', key, value)}
          dataset={{ words }}
        />
      )}

      {currentTab === 'theme' && (
        <ThemeFilters
          filters={filters.theme}
          updateFilter={(key, value) => updateFilter('theme', key, value)}
          dataset={{
            theme_index: words.flatMap(word => word.theme_index || []).map(item => ({
              name: `${item.range} - ${item.theme}`,
              words: [],
              range: item.range,
              theme: item.theme
            })),
            words: words
          }}
        />
      )}

      {/* Quick POS Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-2">詞性快篩</label>
        <QuickPOSFilter />
      </div>

      {/* Search Bar with Clear Button */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="搜尋單字..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="whitespace-nowrap px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            清除搜尋
          </button>
        )}
      </div>

      {/* Results Section */}
      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {currentTab === 'textbook' && '課本進度'}
              {currentTab === 'exam' && '大考衝刺'}
              {currentTab === 'theme' && '主題探索'}
            </h2>
            <p className="text-sm text-gray-500">
              符合條件的單字：{filteredWords.length} 筆
              {searchTerm ? `（含搜尋「${searchTerm}」）` : ''}
            </p>
          </div>
          {filteredWords.length > 0 && (
            <button
              onClick={handleTestRange}
              className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              測驗此範圍
            </button>
          )}
        </div>

        {/* Word Grid */}
        {filteredWords.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">找不到符合條件的單字，請調整篩選條件。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredWords.map((word, index) => {
              const accentColor = accentColors[word.id % accentColors.length] || 'bg-indigo-500';
              return (
                <LazyWordCard
                  key={word.id}
                  word={word}
                  index={index}
                  accentColor={accentColor}
                  onClick={() => handleWordClick(word.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};