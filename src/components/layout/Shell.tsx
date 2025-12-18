import React, { useState, useEffect } from 'react';
import type { UserSettings } from '../../types';

export interface ShellProps {
  children: React.ReactNode;
  route?: string;
  userSettings: UserSettings | null;
  onUserSettingsChange: (settings: UserSettings | null) => void;
}

export const Shell: React.FC<ShellProps> = ({
  children,
  route,
  userSettings,
  onUserSettingsChange
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current route
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Check if current page is active
  const isActive = (path: string): boolean => {
    if (path === '#/') {
      return currentHash === '#/' || currentHash === '';
    }
    return currentHash.startsWith(path);
  };

  const identityLabel = userSettings
    ? `${userSettings.stage === 'senior' ? '高中' : '國中'}・${userSettings.version}版`
    : '選擇教材版本';

  const handleIdentityClick = () => {
    if (confirm('要切換或重新選擇教材版本嗎？')) {
      onUserSettingsChange(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and app name + identity display */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253"
                />
              </svg>
              <a
                href="#/"
                className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight"
              >
                WordGym 單字健身坊
              </a>
            </div>

            {/* Desktop version identity toggle and navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={handleIdentityClick}
                className="group inline-flex items-center gap-2 rounded-full border border-[#5A4FCF] bg-[#F3F0FF] px-3 py-2 text-sm font-semibold text-[#5A4FCF] shadow-sm transition duration-150 hover:bg-[#E7E0FF] focus:outline-none focus:ring-2 focus:ring-[#5A4FCF]/40"
                title="切換教材版本"
              >
                <span className="flex items-center justify-center rounded-full bg-white/70 p-1 text-[#5A4FCF]">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m7-9H5m0 0 3-3m-3 3 3 3"
                    />
                  </svg>
                </span>
                <span className="whitespace-nowrap">{identityLabel}</span>
                <svg
                  className="h-4 w-4 text-[#5A4FCF] transition-transform group-hover:translate-y-[1px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <nav className="flex space-x-2 items-center">
                <button
                  onClick={() => setShowGuide(true)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm font-medium transition duration-150 min-h-[44px] flex items-center"
                  title="查看系統使用指南"
                >
                  [?] 訓練秘笈
                </button>
                <a
                  href="#/favorites"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 min-h-[44px] flex items-center ${
                    isActive('#/favorites')
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  重點訓練
                </a>
                <a
                  href="#/quiz"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 min-h-[44px] flex items-center ${
                    isActive('#/quiz')
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  實力驗收
                </a>
              </nav>
            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="選單"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleIdentityClick}
                  className="inline-flex items-center gap-2 rounded-full border border-[#5A4FCF] bg-[#F3F0FF] px-3 py-2 text-sm font-semibold text-[#5A4FCF] shadow-sm transition duration-150 hover:bg-[#E7E0FF] focus:outline-none focus:ring-2 focus:ring-[#5A4FCF]/40"
                  title="切換教材版本"
                >
                  <span className="flex items-center justify-center rounded-full bg-white/70 p-1 text-[#5A4FCF]">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m7-9H5m0 0 3-3m-3 3 3 3"
                      />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">{identityLabel}</span>
                  <svg
                    className="h-4 w-4 text-[#5A4FCF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowGuide(true)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm font-medium transition text-left"
                >
                  [?] 訓練秘笈
                </button>
                <a
                  href="#/favorites"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition text-left ${
                    isActive('#/favorites')
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  重點訓練
                </a>
                <a
                  href="#/quiz"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition text-left ${
                    isActive('#/quiz')
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  實力驗收
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Training Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">WordGym 訓練秘笈</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="text-white hover:text-indigo-200 text-2xl font-bold transition"
                title="關閉"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="prose prose-indigo max-w-none">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-xl font-bold text-indigo-800 mb-3">
                      歡迎來到 WordGym 單字健身坊！
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      讓我們一起陪您鍛鍊單字記憶肌肉，開啟高效學習之旅。
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-2">
                      請先前往首頁，您可以依據「主題」、「詞性」或「Level」選擇想加強的項目，WordGym
                      會為您量身打造專屬訓練清單！
                    </p>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-indigo-700 mb-3">探索單字庫</h4>
                    <div className="text-gray-700 leading-relaxed space-y-2">
                      <p>
                        在單字清單中，點選任何一個單字，即可進入詳細學習頁面。這裡不僅包含單字、音標、英文例句和中文翻譯等基礎內容，若該單字曾於學測出現，我們也會提供相關例句。
                      </p>
                      <p>
                        更棒的是，您可以延伸學習同義字、反義字、易混淆字、相關片語、字根/字首/字尾等豐富知識，並能一鍵將這些寶貴資料複製，貼到您的個人筆記中！
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-indigo-700 mb-3">
                      重點訓練與複習
                    </h4>
                    <div className="text-gray-700 leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>單字收錄：</strong>{' '}
                          如果遇到容易遺忘的單字，請點擊「重點訓練」，將其收錄以加強練習。
                        </li>
                        <li>
                          <strong>單字移除：</strong>{' '}
                          若您確認已完全掌握該單字，點擊「移除」即可將其從清單中隱藏。
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-lg font-semibold text-indigo-700 mb-3">實力驗收</h4>
                    <div className="text-gray-700 leading-relaxed space-y-2">
                      <p>
                        「實力驗收」提供兩種測驗方式：選擇題和閃卡（中翻英、英翻中），幫助您即時檢視學習成果。
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>測驗回饋：</strong>{' '}
                          您可以從測驗結果了解答題狀況，並能直接從錯題記錄點回單字頁面，進行強化複習！
                        </li>
                        <li>
                          <strong>歷程記錄：</strong>{' '}
                          每一次的測驗結果都會被自動記錄，系統最多保留50筆測驗紀錄。
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <h4 className="text-lg font-semibold text-amber-800 mb-2">特別提醒</h4>
                    <p className="text-gray-700 leading-relaxed">
                      請留意，所有的測驗紀錄是儲存在您
                      <strong>當前使用的載具（裝置）</strong>
                      中，而非個人帳號內。因此，若您更換不同的手機、平板或電腦，每個載具都會留下各自獨立的紀錄喔！
                    </p>
                  </section>

                  <section className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">遇到問題？</h4>
                    <div className="text-gray-700 leading-relaxed space-y-2">
                      <p>如果遇到下拉選單沒有選項、資料顯示不正確等問題，可能是快取資料導致的。</p>
                      <a
                        href="/clear-cache.html"
                        className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        清除快取重新載入
                      </a>
                    </div>
                  </section>

                  <section className="text-center pt-4">
                    <p className="text-indigo-600 font-semibold text-lg">
                      立即啟動您的單字訓練計畫吧！
                    </p>
                  </section>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
        {route !== 'quiz' && (
          <footer className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-2">WordGym 單字健身坊</h3>
              <p className="text-base text-gray-700 font-medium mb-4">
                將學習變成一場互動式的學習旅程！
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                我們提供個人化的單字庫與遊戲化的練習模式，讓您隨時隨地都能高效複習。透過清晰的學習路徑，讓您清楚掌握弱點、看見進步，輕鬆累積單字實力，自信迎接大考。
              </p>
              <div className="text-sm text-gray-600 border-t border-gray-300 pt-4">
                <p>
                  ©{' '}
                  <a
                    href="https://www.junyiacademy.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    均一教育平台
                  </a>
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
