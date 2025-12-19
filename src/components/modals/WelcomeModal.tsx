import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui';
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
  const [selectedStage, setSelectedStage] = useState<Stage>('senior');
  const [selectedVersion, setSelectedVersion] = useState('');

  // When stage changes, reset selected version
  useEffect(() => {
    setSelectedVersion('');
  }, [selectedStage]);

  // Show available versions based on selected stage
  const availableVersions = useMemo(() => {
    // If versions are provided, use them
    if (versions) {
      if (selectedStage === 'senior') {
        return versions['high'] || [];
      } else if (selectedStage === 'junior') {
        return versions['junior'] || [];
      }
    }

    // If loading, return empty
    if (isLoading) return [];

    // Use default versions from VersionService
    return VersionService.getAvailableVersions(
      selectedStage === 'senior' ? 'high' : 'junior'
    );
  }, [selectedStage, versions, isLoading]);

  // Clear selected version when stage changes
  useEffect(() => {
    setSelectedVersion('');
  }, [selectedStage]);

  const handleConfirm = () => {
    if (selectedStage && selectedVersion) {
      setUserSettings({
        stage: selectedStage,
        version: selectedVersion
      });
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">歡迎來到 WordGym！</h2>
        <p className="text-gray-600 mb-6">請選擇您的學程和使用的課本版本</p>

        <div className="space-y-6">
          {/* Stage selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">學程</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStage('senior')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                  selectedStage === 'senior'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                高中
              </button>
              <button
                onClick={() => setSelectedStage('junior')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                  selectedStage === 'junior'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                國中
              </button>
            </div>
          </div>

          {/* Version selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">課本版本</label>
            {!selectedStage ? (
              <div className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500">
                請先選擇學程
              </div>
            ) : isLoading ? (
              <div className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500 animate-pulse">
                {loadingMessage}
              </div>
            ) : availableVersions.length > 0 ? (
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">請選擇版本</option>
                {availableVersions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-3 rounded-xl border border-red-300 bg-red-50 text-red-600">
                無法載入版本列表
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedStage || !selectedVersion || isLoading}
            className="flex-1"
          >
            確認
          </Button>
        </div>
      </div>
    </div>
  );
};
