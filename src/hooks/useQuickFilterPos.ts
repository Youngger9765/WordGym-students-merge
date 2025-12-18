import { useState, useEffect } from 'react';
import { POSType } from '../types';

const LOCAL_STORAGE_KEY = 'wordgym_quick_filter_pos_v1';

export const useQuickFilterPos = () => {
  const [quickFilterPos, setQuickFilterPos] = useState<POSType | 'all'>(() => {
    const storedPos = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedPos as POSType | 'all' || 'all';
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, quickFilterPos);
  }, [quickFilterPos]);

  return { quickFilterPos, setQuickFilterPos };
};