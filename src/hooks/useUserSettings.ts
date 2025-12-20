import { useReducer, useEffect, useState } from 'react';
import type { UserSettings } from '../types';
import { VersionService } from '../services/VersionService';
import { LS } from '../types';

type UserSettingsState = {
  userSettings: UserSettings | null;
  error: string | null;
};

type UserSettingsAction =
  | { type: 'SET_STAGE'; stage: string }
  | { type: 'SET_VERSION'; version: string }
  | { type: 'UPDATE_SETTINGS'; updates: Partial<UserSettings> }
  | { type: 'RESET_SETTINGS' };

function userSettingsReducer(state: UserSettingsState, action: UserSettingsAction): UserSettingsState {
  switch (action.type) {
    case 'SET_STAGE': {
      // Attempt to keep existing settings if they are compatible
      const newSettings: Partial<UserSettings> = {
        stage: action.stage,
        version: undefined
      };

      // If existing settings have a version for this stage, keep it
      if (state.userSettings?.stage === action.stage) {
        newSettings.version = state.userSettings.version;
      }

      return {
        userSettings: {
          ...(state.userSettings || {}),
          ...newSettings
        } as UserSettings,
        error: null
      };
    }
    case 'SET_VERSION': {
      if (!state.userSettings?.stage) {
        return {
          ...state,
          error: 'Stage must be set before setting version'
        };
      }

      const validation = VersionService.validateWithErrors(action.version, state.userSettings.stage);

      if (!validation.isValid) {
        return {
          userSettings: state.userSettings,
          error: validation.errors[0]
        };
      }

      return {
        userSettings: {
          ...state.userSettings,
          version: action.version
        },
        error: null
      };
    }
    case 'UPDATE_SETTINGS': {
      const updates = action.updates;

      // If no existing settings, just set the updates
      if (!state.userSettings) {
        return {
          userSettings: updates as UserSettings,
          error: null
        };
      }

      const settingsToValidate: UserSettings = {
        ...state.userSettings,
        ...updates
      };

      const validation = VersionService.validateWithErrors(
        settingsToValidate.version,
        settingsToValidate.stage
      );

      if (!validation.isValid) {
        return {
          userSettings: state.userSettings,
          error: validation.errors[0]
        };
      }

      return {
        userSettings: settingsToValidate,
        error: null
      };
    }
    case 'RESET_SETTINGS': {
      return { userSettings: null, error: null };
    }
    default:
      return state;
  }
}

export function useUserSettings() {
  const [state, dispatch] = useReducer(userSettingsReducer,
    {
      userSettings: (() => {
        try {
          const raw = localStorage.getItem(LS.userSettings);
          if (raw) {
            return JSON.parse(raw);
          }
        } catch {}
        return null;
      })(),
      error: null
    }
  );

  // Track previous version to detect changes
  const [previousVersion, setPreviousVersion] = useState<string | undefined>(
    state.userSettings?.version
  );

  useEffect(() => {
    try {
      if (state.userSettings) {
        localStorage.setItem(LS.userSettings, JSON.stringify(state.userSettings));

        // Check if version changed (and both old and new versions exist)
        const currentVersion = state.userSettings.version;
        if (previousVersion && currentVersion && previousVersion !== currentVersion) {
          // Version changed - reload the page to ensure all data is refreshed
          window.location.reload();
        } else {
          // Update tracked version
          setPreviousVersion(currentVersion);
        }
      } else {
        localStorage.removeItem(LS.userSettings);
        setPreviousVersion(undefined);
      }
    } catch (e) {
      console.error('Failed to save user settings:', e);
    }
  }, [state.userSettings, previousVersion]);

  const setStage = (stage: string) => {
    dispatch({ type: 'SET_STAGE', stage });
  };

  const setVersion = (version: string) => {
    dispatch({ type: 'SET_VERSION', version });
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', updates });
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
  };

  return {
    userSettings: state.userSettings,
    error: state.error,
    setStage,
    setVersion,
    updateSettings,
    resetSettings,
    setUserSettings: updateSettings
  };
}