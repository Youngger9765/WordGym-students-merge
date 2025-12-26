import { useState, useEffect, useRef } from 'react';
import { UserSettings } from '../types';
import { VersionService } from '../services/VersionService';

type TabType = 'textbook' | 'exam' | 'theme';
type TabFilterValue = {
  vol?: string;
  lesson?: string | string[];
  year?: string;
  range?: string;
  theme?: string;
};

const LOCAL_STORAGE_KEY = 'wordgym_filters_v1';

export const useTabFilters = (userSettings: UserSettings | null) => {
  const prevStageRef = useRef<string | undefined>();

  const getDefaultFilters = () => {
    const normalizedStage = VersionService.normalizeStage(userSettings?.stage || '');
    return {
      textbook: {
        vol: '1',
        lesson: ['1']
      },
      exam: {
        year: '112'
      },
      theme: {
        range: normalizedStage === 'junior' ? '1200' : 'Level 4',
        theme: ''
      }
    };
  };

  const [filters, setFilters] = useState(() => {
    const storedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedFilters
      ? JSON.parse(storedFilters)
      : getDefaultFilters();
  });

  // Reset ALL filters when stage OR version changes
  useEffect(() => {
    const currentStage = VersionService.normalizeStage(userSettings?.stage || '');
    const currentVersion = userSettings?.version || '';
    const prevStage = prevStageRef.current;
    const prevVersionRef = (prevStageRef as any).prevVersion;

    const stageChanged = prevStage && prevStage !== currentStage;
    const versionChanged = prevVersionRef && prevVersionRef !== currentVersion;

    if (stageChanged || versionChanged) {
      // Stage or version changed - reset ALL filters to defaults
      const defaults = getDefaultFilters();
      setFilters(defaults);
    }

    prevStageRef.current = currentStage;
    (prevStageRef as any).prevVersion = currentVersion;
  }, [userSettings?.stage, userSettings?.version]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = (tab: TabType, key: keyof TabFilterValue, value: string | string[]) => {
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