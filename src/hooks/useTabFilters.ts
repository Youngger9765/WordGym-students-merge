import { useState, useEffect } from 'react';
import { UserSettings } from '../types';

type TabType = 'textbook' | 'exam' | 'theme';
type TabFilterValue = {
  vol?: string;
  lesson?: string;
  year?: string;
  range?: string;
  theme?: string;
};

const LOCAL_STORAGE_KEY = 'wordgym_filters_v1';

export const useTabFilters = (userSettings: UserSettings | null) => {
  const getDefaultFilters = () => ({
    textbook: {
      vol: '1',
      lesson: '1'
    },
    exam: {
      year: '112'
    },
    theme: {
      range: userSettings?.stage === 'junior' ? '1200' : '4',
      theme: ''
    }
  });

  const [filters, setFilters] = useState(() => {
    const storedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedFilters
      ? JSON.parse(storedFilters)
      : getDefaultFilters();
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (tab: TabType, key: keyof TabFilterValue, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [key]: value
      }
    }));
  };

  const resetFilters = () => {
    setFilters(getDefaultFilters());
  };

  return { filters, updateFilter, resetFilters };
};