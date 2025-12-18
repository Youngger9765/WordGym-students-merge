import { useEffect, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { HomePage } from './components/pages/HomePage';
import { FavoritesPage } from './components/pages/FavoritesPage';
import { QuizPage } from './components/pages/QuizPage';
import { QuizHistoryPage } from './components/pages/QuizHistoryPage';
import { WordDetailPage } from './components/pages/WordDetailPage';
import { Shell } from './components/layout/Shell';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { useDataset } from './hooks/useDataset';
import { useUserSettings } from './hooks/useUserSettings';
import { loadAllGoogleSheets } from './services/googleSheetLoader';
import { GOOGLE_SHEET_CONFIG, PRESET_VERSION } from './config/googleSheet';

function App() {
  const { hash } = useHashRoute();
  const { data, importRows, markPresetApplied } = useDataset();
  const { userSettings, setUserSettings } = useUserSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Auto-load Google Sheets on mount if no data exists
  useEffect(() => {
    let cancelled = false;

    const autoLoad = async () => {
      console.log('=== 自動載入檢查 ===');
      console.log('目前資料數量:', data.length);
      console.log('Google Sheets 啟用:', GOOGLE_SHEET_CONFIG.enabled);
      console.log('PRESET_VERSION:', PRESET_VERSION);

      // Check localStorage version
      const storedVersion = localStorage.getItem('mvp_vocab_preset_applied_v36');
      console.log('localStorage 版本:', storedVersion);

      if (data.length > 0) {
        console.log('已有資料，跳過載入');
        return;
      }

      if (!GOOGLE_SHEET_CONFIG.enabled) {
        console.log('Google Sheets 未啟用');
        return;
      }

      console.log('開始載入 Google Sheets...');
      setIsLoading(true);
      setLoadError(null);

      try {
        const results = await loadAllGoogleSheets();
        console.log('載入結果:', results);

        if (cancelled) {
          console.log('已取消載入');
          return;
        }

        let isFirstSheet = true;
        for (const { rows, theme } of results) {
          console.log(`匯入 ${rows.length} 筆資料，主題:`, theme);
          if (rows.length > 0 && !cancelled) {
            // Import with replace: true on first sheet, false on subsequent
            const opts = isFirstSheet
              ? { overrideExamples: false, replace: true }
              : { overrideExamples: false, replace: false };
            const stats = importRows(rows, opts);
            console.log('匯入統計:', stats);
            isFirstSheet = false;
          }
        }

        if (!cancelled) {
          // Mark preset as successfully applied
          markPresetApplied();
          console.log('✅ Google Sheets 載入完成，總資料數:', data.length);
        }
      } catch (error) {
        console.error('載入 Google Sheets 失敗:', error);
        setLoadError(`載入資料失敗: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    autoLoad();

    return () => {
      cancelled = true;
    };
  }, []); // Run only once on mount

  // Show welcome modal if no user settings
  useEffect(() => {
    if (!userSettings && data.length > 0) {
      setShowWelcome(true);
    }
  }, [userSettings, data.length]);

  // Get current route for Shell
  const getRoute = () => {
    if (hash.startsWith('#/quiz')) return 'quiz';
    if (hash.startsWith('#/favorites')) return 'favorites';
    if (hash.startsWith('#/word/')) return 'word';
    return 'home';
  };

  const renderContent = () => {
    // Word detail page
    if (hash.startsWith('#/word/')) {
      const wordId = parseInt(hash.replace('#/word/', ''));
      const word = data.find(w => w.id === wordId);
      if (!word) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">找不到該單字</p>
            <button
              onClick={() => window.location.hash = '#/'}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              返回首頁
            </button>
          </div>
        );
      }
      return <WordDetailPage word={word} />;
    }

    switch (hash) {
      case '#/':
      case '':
        return <HomePage />;
      case '#/favorites':
        return <FavoritesPage />;
      case '#/quiz':
        return <QuizPage />;
      case '#/quiz-history':
        return <QuizHistoryPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          setUserSettings={setUserSettings}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Main App */}
      <Shell
        route={getRoute()}
        userSettings={userSettings}
        onUserSettingsChange={(settings) => {
          setUserSettings(settings);
          if (!settings) {
            setShowWelcome(true);
          }
        }}
      >
        {/* Loading Status */}
        {isLoading && (
          <div className="mb-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
            <div className="animate-pulse">
              <div className="text-lg font-semibold text-indigo-700 mb-2">載入單字中...</div>
              <div className="text-sm text-indigo-600">請稍候</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {loadError && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
            <div className="text-lg font-semibold text-red-700 mb-2">載入失敗</div>
            <div className="text-sm text-red-600 mb-3">{loadError}</div>
            <div className="text-xs text-gray-600">
              請確認 Google Sheet 已設為「可檢視」或「發布至網路」
            </div>
          </div>
        )}

        {renderContent()}
      </Shell>
    </>
  );
}

export default App;