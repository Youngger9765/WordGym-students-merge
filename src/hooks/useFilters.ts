import { useState, useMemo } from 'react';
import { VocabularyWord, FilterOptions } from '../types';

export function useFilters(initialWords: VocabularyWord[] = [], initialOptions?: Partial<FilterOptions>) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: '',
    posFilter: 'all',
    levelFilter: '',
    themeFilter: '',
    ...initialOptions
  });

  const filteredWords = useMemo(() => {
    return initialWords.filter(word => {
      const matchesSearch = filterOptions.searchTerm
        ? word.english_word.toLowerCase().includes(filterOptions.searchTerm.toLowerCase())
        : true;

      const matchesPOS = filterOptions?.posFilter === 'all'
        || (word.posTags?.[0] || '').toLowerCase() === filterOptions?.posFilter?.toLowerCase();

      const matchesLevel = !filterOptions.levelFilter
        || word.level === filterOptions.levelFilter;

      const matchesTheme = !filterOptions.themeFilter
        || word.themes?.includes(filterOptions.themeFilter);

      return matchesSearch && matchesPOS && matchesLevel && matchesTheme;
    });
  }, [initialWords, filterOptions]);

  const setSearchTerm = (term: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, searchTerm: term }));
  };

  const setPosFilter = (pos: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, posFilter: pos }));
  };

  const setLevelFilter = (level: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, levelFilter: level }));
  };

  const setThemeFilter = (theme: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, themeFilter: theme }));
  };

  return {
    filteredWords,
    searchTerm: filterOptions.searchTerm,
    posFilter: filterOptions?.posFilter,
    levelFilter: filterOptions.levelFilter,
    themeFilter: filterOptions.themeFilter,
    setSearchTerm,
    setPosFilter,
    setLevelFilter,
    setThemeFilter
  };
}