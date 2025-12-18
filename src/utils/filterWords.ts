import { VocabularyWord, UserSettings, POSType, Filters } from '../types';

export function filterWords(
  words: VocabularyWord[],
  userSettings: UserSettings,
  currentTab: 'textbook' | 'exam' | 'theme',
  filters: Filters,
  quickFilterPos: POSType | 'all',
  searchTerm: string
): VocabularyWord[] {
  return words.filter(word => {
    // Stage filter
    if (word.stage !== userSettings.stage) return false;

    // Tab-specific filters
    switch (currentTab) {
      case 'textbook':
        const textbookMatch = word.textbook_index.some(
          item =>
            item.version === userSettings.version &&
            item.vol === filters.textbook.vol &&
            item.lesson === filters.textbook.lesson
        );
        if (!textbookMatch) return false;
        break;

      case 'exam':
        const examMatch = word.exam_tags.includes(filters.exam.year || '');
        if (!examMatch) return false;
        break;

      case 'theme':
        const themeMatch = word.theme_index.some(
          item =>
            item.range === filters.theme.range &&
            (filters.theme.theme ? item.theme === filters.theme.theme : true)
        );
        if (!themeMatch) return false;
        break;
    }

    // POS filter
    if (quickFilterPos !== 'all') {
      const posMatch = word.posTags.includes(quickFilterPos);
      if (!posMatch) return false;
    }

    // Search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const wordMatches =
        word.english_word.toLowerCase().includes(searchTermLower) ||
        word.chinese_definition?.toLowerCase().includes(searchTermLower) ||
        word.example_sentence?.toLowerCase().includes(searchTermLower);

      if (!wordMatches) return false;
    }

    return true;
  });
}