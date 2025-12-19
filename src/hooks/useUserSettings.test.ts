import { renderHook, act } from '@testing-library/react-hooks';
import { useUserSettings } from './useUserSettings';
import { LS } from '../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useUserSettings', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with settings from localStorage', () => {
    const initialSettings = { stage: 'high', version: '龍騰' };
    localStorage.setItem(LS.userSettings, JSON.stringify(initialSettings));

    const { result } = renderHook(() => useUserSettings());

    expect(result.current.userSettings).toEqual(initialSettings);
  });

  it('validates stage correctly', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('high');
    });

    expect(result.current.userSettings?.stage).toBe('high');
    expect(result.current.error).toBeNull();
  });

  it('prevents setting invalid stage', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('invalid-stage');
    });

    expect(result.current.userSettings?.stage).toBe('invalid-stage');
    expect(result.current.error).toBeDefined();
  });

  it('prevents setting version without stage', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setVersion('龍騰');
    });

    expect(result.current.userSettings?.version).toBeUndefined();
    expect(result.current.error).toBe('Stage must be set before setting version');
  });

  it('validates version correctly', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('high');
      result.current.setVersion('龍騰');
    });

    expect(result.current.userSettings?.version).toBe('龍騰');
    expect(result.current.error).toBeNull();
  });

  it('prevents setting invalid version', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('high');
      result.current.setVersion('invalid-version');
    });

    expect(result.current.userSettings?.version).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });

  it('updates settings with validation', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setUserSettings({ stage: 'high', version: '龍騰' });
    });

    expect(result.current.userSettings?.stage).toBe('high');
    expect(result.current.userSettings?.version).toBe('龍騰');
    expect(result.current.error).toBeNull();
  });

  it('saves settings to localStorage', () => {
    const { result, rerender } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setUserSettings({ stage: 'high', version: '龍騰' });
    });

    rerender();

    const storedSettings = JSON.parse(localStorage.getItem(LS.userSettings) || '{}');
    expect(storedSettings).toEqual({ stage: 'high', version: '龍騰' });
  });

  it('can reset settings', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setUserSettings({ stage: 'high', version: '龍騰' });
      result.current.resetSettings();
    });

    expect(result.current.userSettings).toBeNull();
    expect(localStorage.getItem(LS.userSettings)).toBeNull();
  });
});