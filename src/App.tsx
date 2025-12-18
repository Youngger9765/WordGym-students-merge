import { useHashRoute } from './hooks/useHashRoute';
import { HomePage } from './components/pages/HomePage';
import { FavoritesPage } from './components/pages/FavoritesPage';
import { QuizPage } from './components/pages/QuizPage';
import { QuizHistoryPage } from './components/pages/QuizHistoryPage';
import { MultipleChoiceQuiz } from './components/quiz/MultipleChoiceQuiz';
import { FlashcardQuiz } from './components/quiz/FlashcardQuiz';
import { useDataset } from './hooks/useDataset';

function App() {
  const { hash, push } = useHashRoute();
  const { data } = useDataset();

  const goToHome = () => push('#/');
  const goToAbout = () => push('#/about');
  const goToFavorites = () => push('#/favorites');
  const goToQuiz = () => push('#/quiz');
  const goToQuizHistory = () => push('#/quiz-history');

  const renderContent = () => {
    switch (hash) {
      case '#/':
        return <HomePage />;
      case '#/about':
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              關於 WordGym
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                WordGym 單字健身坊是一個現代化的單字學習平台，專為學生設計。
              </p>
              <p>
                本專案採用最新的前端技術，提供流暢的學習體驗，並能打包成單一 HTML 檔案，
                方便部署和分享。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">核心功能</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>語音朗讀單字與例句</li>
                  <li>詞性與主題分類</li>
                  <li>學習進度追蹤</li>
                  <li>響應式設計，支援各種裝置</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case '#/favorites':
        return <FavoritesPage />;
      case '#/quiz':
        return <QuizPage />;
      case '#/quiz-history':
        return <QuizHistoryPage />;
      case '#/multiple-choice-quiz':
        return <MultipleChoiceQuiz words={data.slice(0, 10)} />;
      case '#/flashcard-quiz':
        return <FlashcardQuiz words={data.slice(0, 10)} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          WordGym 單字健身坊
        </h1>
        <p className="text-xl text-gray-600">學生版</p>
      </header>

      {/* Navigation */}
      <nav className="mb-8 flex gap-4 flex-wrap">
        {[
          { label: '首頁', route: '#/', action: goToHome },
          { label: '關於', route: '#/about', action: goToAbout },
          { label: '收藏單字', route: '#/favorites', action: goToFavorites },
          { label: '測驗', route: '#/quiz', action: goToQuiz },
          { label: '測驗紀錄', route: '#/quiz-history', action: goToQuizHistory }
        ].map(({ label, route, action }) => (
          <button
            key={route}
            onClick={action}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hash === route
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="bg-white rounded-lg shadow-lg p-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        WordGym Students v2.0.0 | Built with React + Vite + TypeScript
      </footer>
    </div>
  );
}

export default App;