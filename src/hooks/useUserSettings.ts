/**
 * useUserSettings Hook - User Preferences (Stage & Textbook Version)
 * Migrated from index.html lines 1507-1529
 */

import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';

const LS_KEY = 'wordgym_user_settings_v1';

export function useUserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      if (userSettings) {
        localStorage.setItem(LS_KEY, JSON.stringify(userSettings));
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch (e) {
      console.error('Failed to save user settings:', e);
    }
  }, [userSettings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setUserSettings(prev => prev ? { ...prev, ...updates } : null);
  };

  return {
    userSettings,
    setUserSettings,
    updateSettings
  };
}
