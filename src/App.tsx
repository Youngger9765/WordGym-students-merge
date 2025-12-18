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

  // Debug: Track data changes
  useEffect(() => {
    console.log('📊 Data state 已更新，目前長度:', data.length);
  }, [data.length]);

  // ALWAYS load Google Sheets on mount (localStorage disabled)
  useEffect(() => {
    let cancelled = false;

    const autoLoad = async () => {
      console.log('=== 自動載入 (ALWAYS LOAD) ===');
      console.log('Google Sheets 啟用:', GOOGLE_SHEET_CONFIG.enabled);
      console.log('PRESET_VERSION:', PRESET_VERSION);
      console.log('⚠️ localStorage caching DISABLED - always loading fresh data');

      // REMOVED: Skip loading if data exists
      // ALWAYS load from Google Sheets to ensure fresh data

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
        let finalStats = null;
        for (const { rows, theme } of results) {
          console.log(`匯入 ${rows.length} 筆資料，主題:`, theme);
          if (rows.length > 0) {
            console.log('第一筆資料範例:', rows[0]);
            console.log('資料欄位:', Object.keys(rows[0]));

            // Check textbook_index data
            const textbookIndexSamples = rows.slice(0, 10)
              .map((row, idx) => ({
                idx,
                word: row.english_word || row['英文單字'] || row.Word,
                textbook_index: row.textbook_index
              }))
              .filter(item => item.textbook_index && item.textbook_index.trim());
            console.log('📚 textbook_index 範例 (前10筆有資料的):', textbookIndexSamples);

            // Check exam_tags data
            const examTagsSamples = rows.slice(0, 10)
              .map((row, idx) => ({
                idx,
                word: row.english_word || row['英文單字'] || row.Word,
                exam_tags: row.exam_tags
              }))
              .filter(item => item.exam_tags && item.exam_tags.trim());
            console.log('🎯 exam_tags 範例 (前10筆有資料的):', examTagsSamples);
          }
          if (rows.length > 0 && !cancelled) {
            // Import with replace: true on first sheet, false on subsequent
            const opts = isFirstSheet
              ? { overrideExamples: false, replace: true }
              : { overrideExamples: false, replace: false };
            const stats = importRows(rows, opts);
            console.log('匯入統計:', stats);
            finalStats = stats;
            isFirstSheet = false;
          }
        }

        if (!cancelled) {
          // Mark preset as successfully applied
          markPresetApplied();
          console.log('✅ Google Sheets 載入完成');
          console.log('  - 統計顯示總數:', finalStats?.totalAfter ?? 0);
          console.log('  - 實際 data.length:', data.length);
          console.log('  ⚠️ 注意: data.length 因 React 狀態更新是非同步的，可能還未更新');
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
        return <HomePage words={data} />;
      case '#/favorites':
        return <FavoritesPage words={data} />;
      case '#/quiz':
        return <QuizPage words={data} />;
      case '#/quiz-history':
        return <QuizHistoryPage />;
      default:
        return <HomePage words={data} />;
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