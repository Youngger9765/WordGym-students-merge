/**
 * Filtering Utilities for Vocabulary Words
 * Migrated from index.html lines 471-633
 */

import type {
  VocabularyWord,
  UserSettings,
  CurrentTab,
  Filters,
  POSType
} from '../types';
import { VersionService } from '../services/VersionService';

/**
 * Core filtering logic for vocabulary words
 * Handles stage, textbook, exam, and theme filtering with quick POS filter
 * Migrated from index.html lines 471-633
 */
export function getFilteredWords(
  data: VocabularyWord[],
  userSettings: UserSettings | null,
  currentTab: CurrentTab,
  filters: Filters,
  quickFilterPos: POSType | 'all'
): VocabularyWord[] {
  if (!data || !Array.isArray(data)) return [];

  let filtered = [...data];

  // 1. Stage Filter: Filter by user's selected stage (junior/senior)
  if (userSettings && userSettings.stage) {
    const stageStats: Record<string, number> = {};
    const stageSamples: Record<string, VocabularyWord[]> = {};

    filtered.forEach(word => {
      const stage = word.stage || 'null';
      stageStats[stage] = (stageStats[stage] || 0) + 1;
      if (!stageSamples[stage]) stageSamples[stage] = [];
      if (stageSamples[stage].length < 3) stageSamples[stage].push(word);
    });

    // Removed logging;
    // Removed logging;

    // STRICT stage filtering - normalize both sides for comparison
    // Fix for Issue #31: 國高中資料必須互相獨立
    const normalizedUserStage = VersionService.normalizeStage(userSettings.stage);

    filtered = filtered.filter(word => {
      if (!word.stage) return false; // Exclude words with no stage
      const normalizedWordStage = VersionService.normalizeStage(word.stage);
      return normalizedWordStage === normalizedUserStage;
    });

    // Removed logging: ${filtered.length} words remaining`);
  }

  // 2. Tab-specific Filters
  if (currentTab === 'textbook') {
    // Textbook Tab: Filter by version, vol, and lesson
    const vol = filters.textbook?.vol;
    const lesson = filters.textbook?.lesson;

    if (userSettings && userSettings.version) {
      // Removed unused sampleTextbookIndex

      filtered = filtered.filter(word => {
        const textbookIndex = Array.isArray(word.textbook_index) ? word.textbook_index : [];
        if (textbookIndex.length === 0) return false;

        return textbookIndex.some(item => {
          const matchVersion = item.version === userSettings.version;
          const matchVol = !vol || item.vol === vol;

          // Support both single lesson (backward compatibility) and multi-select lessons
          const matchLesson = !lesson ||
            (Array.isArray(lesson)
              ? lesson.includes(item.lesson)
              : item.lesson === lesson);

          return matchVersion && matchVol && matchLesson;
        });
      });

      // Removed logging: ${filtered.length} words`);
    }
  } else if (currentTab === 'exam') {
    // Exam Tab: Filter by exam tags
    const year = filters.exam?.year;

    if (year) {
      filtered = filtered.filter(word => {
        const examTags = Array.isArray(word.exam_tags) ? word.exam_tags : [];
        return examTags.some(tag => tag && tag.includes(year));
      });
    } else {
      // Show all exam-tagged words if no specific year selected
      if (userSettings?.stage === 'junior') {
        filtered = filtered.filter(word => {
          const examTags = Array.isArray(word.exam_tags) ? word.exam_tags : [];
          return examTags.some(tag => tag && tag.includes('會考'));
        });
      } else if (userSettings?.stage === 'senior') {
        filtered = filtered.filter(word => {
          const examTags = Array.isArray(word.exam_tags) ? word.exam_tags : [];
          return examTags.some(tag => tag && tag.includes('學測'));
        });
      }
    }

    // Removed logging: ${filtered.length} words`);
  } else if (currentTab === 'theme') {
    // Theme Tab: Filter by range and theme
    const range = filters.theme?.range;
    const theme = filters.theme?.theme;

    if (range || theme) {
      filtered = filtered.filter(word => {
        const themeIndex = Array.isArray(word.theme_index) ? word.theme_index : [];
        if (themeIndex.length === 0) return false;

        return themeIndex.some(item => {
          const matchRange = !range || item.range === range;
          const matchTheme = !theme || item.theme === theme;
          return matchRange && matchTheme;
        });
      });

      // Removed logging: ${filtered.length} words`);
    }
  }

  // 3. Quick POS Filter (applies across all tabs)
  if (quickFilterPos && quickFilterPos !== 'all') {
    filtered = filtered.filter(word => {
      const posTags = word.posTags || [];
      return posTags.includes(quickFilterPos);
    });

    // Removed logging: ${filtered.length} words`);
  }

  return filtered;
}

/**
 * Extract unique values for dropdown filters
 */
export function getUniqueFilterValues(
  data: VocabularyWord[],
  field: 'vol' | 'lesson' | 'year' | 'range' | 'theme',
  userSettings: UserSettings | null
): string[] {
  const values = new Set<string>();

  data.forEach(word => {
    if (field === 'vol' || field === 'lesson') {
      // Textbook fields
      const textbookIndex = Array.isArray(word.textbook_index) ? word.textbook_index : [];
      textbookIndex.forEach(item => {
        if (userSettings?.version && item.version === userSettings.version) {
          const value = item[field as 'vol' | 'lesson'];
          if (value) values.add(value);
        }
      });
    } else if (field === 'year') {
      // Exam year
      const examTags = Array.isArray(word.exam_tags) ? word.exam_tags : [];
      examTags.forEach(tag => {
        if (tag) values.add(tag);
      });
    } else if (field === 'range' || field === 'theme') {
      // Theme fields
      const themeIndex = Array.isArray(word.theme_index) ? word.theme_index : [];
      themeIndex.forEach(item => {
        const value = item[field as 'range' | 'theme'];
        if (value) values.add(value);
      });
    }
  });

  return Array.from(values).sort();
}
