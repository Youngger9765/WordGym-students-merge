import { useState, useEffect } from 'react';
import { POSType } from '../types';

const LOCAL_STORAGE_KEY = 'wordgym_quick_filter_pos_v1';
const CUSTOM_EVENT_NAME = 'quickFilterPosChange';

export const useQuickFilterPos = () => {
  const [quickFilterPos, setQuickFilterPos] = useState<POSType | 'all'>(() => {
    const storedPos = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedPos as POSType | 'all' || 'all';
  });

  // Persist to localStorage and dispatch custom event when state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, quickFilterPos);

    // Dispatch custom event to notify other components
    const event = new CustomEvent(CUSTOM_EVENT_NAME, {
      detail: { newValue: quickFilterPos }
    });
    window.dispatchEvent(event);
  }, [quickFilterPos]);

  // Listen for changes from other components
  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ newValue: POSType | 'all' }>;
      const newValue = customEvent.detail.newValue;

      // Update state if different to avoid infinite loops
      setQuickFilterPos((currentValue) => {
        if (currentValue !== newValue) {
          return newValue;
        }
        return currentValue;
      });
    };

    window.addEventListener(CUSTOM_EVENT_NAME, handleFilterChange);
    return () => window.removeEventListener(CUSTOM_EVENT_NAME, handleFilterChange);
  }, []);

  return { quickFilterPos, setQuickFilterPos };
};