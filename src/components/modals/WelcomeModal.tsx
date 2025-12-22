import React, { useMemo } from 'react';
import { VersionService } from '../../services/VersionService';
import type { UserSettings } from '../../types';

export interface WelcomeModalProps {
  setUserSettings: (settings: UserSettings) => void;
  onClose?: () => void;
  isLoading?: boolean;
  versions?: Record<string, string[]>;
  loadingMessage?: string;
}

type Stage = 'senior' | 'junior';

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  setUserSettings,
  onClose,
  isLoading = false,
  versions,
  loadingMessage = '載入版本中...'
}) => {
  // Get all versions grouped by stage
  const allVersions = useMemo(() => {
    if (versions) {
      return {
        high: versions['high'] || [],
        junior: versions['junior'] || []
      };
    }

    // If loading, return empty
    if (isLoading) {
      return { high: [], junior: [] };
    }

    // Use default versions from VersionService
    return {
      high: VersionService.getAvailableVersions('high'),
      junior: VersionService.getAvailableVersions('junior')
    };
  }, [versions, isLoading]);

  const handleVersionSelect = (version: string, stage: Stage) => {
    // Auto-confirm immediately
    setUserSettings({
      stage,
      version
    });
    // Navigate to flashcard page after curriculum selection
    window.location.hash = '#/';
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">歡迎來到 WordGym！</h2>
        <p className="text-gray-600 mb-6">請選擇您的學程和使用的課本版本</p>

        <div className="space-y-6">
          {isLoading ? (
            <div className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500 animate-pulse">
              {loadingMessage}
            </div>
          ) : (
            <>
              {/* High school versions */}
              {allVersions.high.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-3">高中</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {allVersions.high.map(version => (
                      <button
                        key={version}
                        onClick={() => handleVersionSelect(version, 'senior')}
                        className="px-6 py-4 rounded-xl font-semibold bg-white text-purple-700 hover:bg-purple-600 hover:text-white transition shadow-sm hover:shadow-md text-lg"
                      >
                        {version}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Junior high versions */}
              {allVersions.junior.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-2xl border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">國中</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {allVersions.junior.map(version => (
                      <button
                        key={version}
                        onClick={() => handleVersionSelect(version, 'junior')}
                        className="px-6 py-4 rounded-xl font-semibold bg-white text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-sm hover:shadow-md text-lg"
                      >
                        {version}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {allVersions.high.length === 0 && allVersions.junior.length === 0 && (
                <div className="px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-600">
                  無法載入版本列表
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
