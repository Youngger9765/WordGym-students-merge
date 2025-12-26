import { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'wordgym_filtered_word_ids_v1';
const CUSTOM_EVENT_NAME = 'filteredWordIdsChange';

/**
 * Global state for currently filtered word IDs
 * - Syncs between HomePage (word card selection) and QuizPage (quiz start)
 * - Persists to localStorage
 * - Broadcasts changes via custom event
 */
export const useFilteredWordIds = () => {
  const [filteredWordIds, setFilteredWordIds] = useState<number[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Persist to localStorage and broadcast changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredWordIds));

    // Dispatch custom event to notify other components
    const event = new CustomEvent(CUSTOM_EVENT_NAME, {
      detail: { wordIds: filteredWordIds }
    });
    window.dispatchEvent(event);
  }, [filteredWordIds]);

  // Listen for changes from other components
  useEffect(() => {
    const handleFilterChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ wordIds: number[] }>;
      const newIds = customEvent.detail.wordIds;

      setFilteredWordIds((currentIds) => {
        // Only update if actually different
        if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
          return newIds;
        }
        return currentIds;
      });
    };

    window.addEventListener(CUSTOM_EVENT_NAME, handleFilterChange);
    return () => window.removeEventListener(CUSTOM_EVENT_NAME, handleFilterChange);
  }, []);

  return { filteredWordIds, setFilteredWordIds };
};
