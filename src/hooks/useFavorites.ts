/**
 * useFavorites Hook - Manage Favorite Words
 * Migrated from index.html lines 1419-1437
 */

import { useState, useEffect } from 'react';

const LS_KEY = 'mvp_vocab_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed.map(Number) : []);
      }
    } catch {}
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  const addFavorite = (wordId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  };

  const removeFavorite = (wordId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  };

  const clearFavorites = () => {
    setFavorites(new Set());
  };

  const isFavorite = (wordId: number): boolean => {
    return favorites.has(wordId);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite
  };
}
