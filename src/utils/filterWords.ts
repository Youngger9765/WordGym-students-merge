import { VocabularyWord, UserSettings, POSType, Filters } from '../types';

export function filterWords(
  words: VocabularyWord[],
  userSettings: UserSettings,
  currentTab: 'textbook' | 'exam' | 'theme',
  filters: Filters,
  quickFilterPos: POSType | 'all',
  searchTerm: string
): VocabularyWord[] {
  console.log('🔍 filterWords called:');
  console.log('  - Total words:', words.length);
  console.log('  - currentTab:', currentTab);
  console.log('  - userSettings:', userSettings);
  console.log('  - filters:', filters);
  console.log('  - quickFilterPos:', quickFilterPos);
  console.log('  - searchTerm:', searchTerm);

  const filtered = words.filter(word => {
    // Stage filter
    if (word.stage !== userSettings.stage) return false;

    // Tab-specific filters
    switch (currentTab) {
      case 'textbook':
        if (!word.textbook_index || word.textbook_index.length === 0) return false;
        const textbookMatch = word.textbook_index?.some(item => {
          if (!item) return false;
          let match = true;
          // Only check if filter is set
          if (userSettings.version && item.version !== userSettings.version) match = false;
          if (filters.textbook?.vol && item.vol !== filters.textbook.vol) match = false;
          if (filters.textbook?.lesson && item.lesson !== filters.textbook.lesson) match = false;
          return match;
        });
        if (!textbookMatch) return false;
        break;

      case 'exam':
        const examMatch = word.exam_tags?.includes(filters.exam?.year || '') || false;
        if (!examMatch) return false;
        break;

      case 'theme':
        if (userSettings.stage === 'junior') {
          // Junior: Use theme_index
          const themeMatch = word.theme_index?.some(
            item =>
              item.range === filters.theme?.range &&
              (filters.theme?.theme ? item.theme === filters.theme.theme : true)
          );
          if (!themeMatch) return false;
        } else {
          // Senior: Use level and themes
          if (filters.theme?.range) {
            // Check level match
            if (String(word.level || '').trim() !== String(filters.theme.range).trim()) {
              return false;
            }
          }
          if (filters.theme?.theme) {
            // Check if word has this theme
            if (!word.themes || !word.themes.includes(filters.theme.theme)) {
              return false;
            }
          }
        }
        break;
    }

    // POS filter
    if (quickFilterPos !== 'all') {
      const posMatch = word.posTags?.includes(quickFilterPos) || false;
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

  console.log('🔍 filterWords result:', filtered.length, 'words');
  if (filtered.length > 0) {
    console.log('  - First 3 filtered words:', filtered.slice(0, 3).map(w => ({
      english: w.english_word,
      stage: w.stage,
      textbook_index: w.textbook_index
    })));
  }

  return filtered;
}