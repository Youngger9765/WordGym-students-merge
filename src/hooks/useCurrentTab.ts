import { useState, useEffect } from 'react';

type TabType = 'textbook' | 'exam' | 'theme';

const LOCAL_STORAGE_KEY = 'wordgym_current_tab_v1';

export const useCurrentTab = () => {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const storedTab = localStorage.getItem(LOCAL_STORAGE_KEY) as TabType | null;
    return storedTab || 'textbook';
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, currentTab);
  }, [currentTab]);

  return { currentTab, setCurrentTab };
};