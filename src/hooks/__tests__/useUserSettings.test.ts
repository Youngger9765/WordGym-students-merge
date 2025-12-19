import { renderHook, act } from '@testing-library/react-hooks/pure';
import { useUserSettings } from '../useUserSettings';
import { LS } from '../../types';

describe('useUserSettings', () => {
  // Reset localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with null settings from localStorage', () => {
    const { result } = renderHook(() => useUserSettings());
    expect(result.current.userSettings).toBeNull();
  });

  test('sets stage with validation', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('beginner');
    });

    expect(result.current.userSettings?.stage).toBe('beginner');
    expect(result.current.userSettings?.version).toBeUndefined();
  });

  test('sets version after stage with validation', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('beginner');
      result.current.setVersion('1.0');
    });

    expect(result.current.userSettings?.stage).toBe('beginner');
    expect(result.current.userSettings?.version).toBe('1.0');
    expect(result.current.error).toBeNull();
  });

  test('prevents setting version without stage', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setVersion('1.0');
    });

    expect(result.current.userSettings).toBeNull();
    expect(result.current.error).toBe('Stage must be set before setting version');
  });

  test('prevents invalid version', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('beginner');
      result.current.setVersion('3.0'); // Invalid version for beginner
    });

    expect(result.current.userSettings?.version).toBeUndefined();
    expect(result.current.error).toContain('Invalid version');
  });

  test('resets settings', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.setStage('beginner');
      result.current.setVersion('1.0');
      result.current.resetSettings();
    });

    expect(result.current.userSettings).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('updates settings with validation', () => {
    const { result } = renderHook(() => useUserSettings());

    act(() => {
      result.current.updateSettings({
        stage: 'beginner',
        version: '1.0',
        dailyTarget: 10
      });
    });

    expect(result.current.userSettings?.stage).toBe('beginner');
    expect(result.current.userSettings?.version).toBe('1.0');
    expect(result.current.userSettings?.dailyTarget).toBe(10);
    expect(result.current.error).toBeNull();
  });

  test('saves and retrieves settings from localStorage', () => {
    const { result } = renderHook(() => useUserSettings());

    // Set some settings
    act(() => {
      result.current.updateSettings({
        stage: 'beginner',
        version: '1.0',
        dailyTarget: 15
      });
    });

    // Check localStorage interactions
    const savedSettings = localStorage.getItem(LS.userSettings);
    expect(savedSettings).toBeTruthy();

    const parsedSettings = JSON.parse(savedSettings!);
    expect(parsedSettings.stage).toBe('beginner');
    expect(parsedSettings.version).toBe('1.0');
    expect(parsedSettings.dailyTarget).toBe(15);
  });
});