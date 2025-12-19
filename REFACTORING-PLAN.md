# WordGym Students - 重構計劃 (Refactoring Plan)

**版本**: 1.0
**建立日期**: 2025-12-20
**最後更新**: 2025-12-20
**負責人**: Development Team

---

## 目錄

1. [現況總覽](#1-現況總覽)
2. [關鍵問題](#2-關鍵問題)
3. [重構計劃](#3-重構計劃)
4. [技術債](#4-技術債)
5. [PRD 對照](#5-prd-對照)
6. [執行優先級矩陣](#6-執行優先級矩陣)

---

## 1. 現況總覽

### 1.1 專案規模

| 指標 | 數量 | 備註 |
|------|------|------|
| 總程式碼行數 | 6,736 行 | TypeScript/TSX |
| TypeScript 檔案 | 57 個 | src/ 目錄下 |
| React 元件 | 18 個 | .tsx 檔案 |
| Custom Hooks | 14 個 | useDataset, useFavorites 等 |
| Utility 函數 | 13 個 | 資料處理、篩選等 |
| 測試檔案 | 50 個 | Playwright E2E tests |
| 建置產出大小 | 5.1 MB (gzip: 1.5 MB) | 單一 HTML 檔案 |
| 原始建置大小 | 6.8 MB | dist/index.html |

### 1.2 主要功能模組狀態

| 模組 | 完成度 | 狀態 | 關鍵問題 |
|------|--------|------|----------|
| 版本選擇機制 | 95% | ✅ 良好 | 需優化 UX flow |
| 課本進度篩選 | 90% | ✅ 良好 | 資料正規化問題 |
| 大考衝刺篩選 | 85% | ⚠️ 可用 | exam_tags 資料解析待驗證 |
| 主題探索篩選 | 90% | ✅ 良好 | 國中/高中分流邏輯正確 |
| 重點訓練 (Favorites) | 100% | ✅ 良好 | 已修復競態條件問題 |
| 選擇題測驗 | 95% | ✅ 良好 | 選項分佈邏輯已優化 |
| 閃卡測驗 | 95% | ✅ 良好 | 狀態管理完善 |
| 單字詳情頁 | 100% | ✅ 良好 | 功能完整 |
| 測驗歷史紀錄 | 100% | ✅ 良好 | 資料持久化正常 |

### 1.3 已知問題清單

**按嚴重性分類**:

#### 🔴 P0 - 阻擋上線的問題
- 無（Build 成功，核心功能運作正常）

#### 🟡 P1 - 重要但不緊急
1. **大量移除的 Logging 程式碼**
   - 54 處標記為 `// Removed logging`
   - 120 處 `console.log` 仍然存在
   - 需要統一 logging 策略

2. **版本選擇 UX 流程**
   - 目前有兩個 Modal 層疊（WelcomeModal + VersionModal）
   - 可以簡化為單一流程

3. **資料正規化一致性**
   - `VersionService.normalize()` 使用不一致
   - 部分欄位仍有未清理的 POS annotations

#### 🟢 P2 - 優化建議
1. **Bundle Size 優化**
   - 5.1 MB 建置檔案過大
   - 考慮 code splitting（但會失去 single HTML 優勢）
   - 考慮移除未使用的依賴

2. **TypeScript 嚴格性**
   - 有部分 `any` 類型使用
   - `word_forms_detail` 類型定義複雜

3. **測試覆蓋率**
   - 缺乏 Unit Tests
   - 主要依賴 E2E tests

---

## 2. 關鍵問題

### 2.1 Code Quality Issues

#### Issue #1: Logging 策略不一致

**問題描述**:
- 程式碼中有 54 處註解標記為 `// Removed logging`
- 仍有 120 處 `console.log` 散佈在程式碼中
- 部分是除錯用、部分是功能性（如資料驗證）
- 無統一的 logging 策略

**受影響檔案**:
```
src/hooks/useDataset.ts (11 處)
src/components/quiz/FlashcardQuiz.tsx (6 處)
src/App.tsx (2 處)
src/components/pages/WordDetailPage.tsx (3 處)
tests/*.spec.ts (18 處)
```

**根本原因**:
- 重構過程中快速移除 console.log 導致程式碼不一致
- 缺乏開發環境 vs 生產環境的 logging 區分機制

**建議解決方案**:

**選項 A - 完全移除** (推薦給生產環境):
```typescript
// 建立 logger utility
// src/utils/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // Error 永遠記錄
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  }
};

// 替換所有 console.log
import { logger } from './utils/logger';
logger.log('Debug info'); // 只在開發環境顯示
```

**選項 B - 保留關鍵 logs**:
- 保留資料驗證相關的 logs (如 exam_tags 解析)
- 移除所有 UI 事件相關的 debug logs
- 使用註解標記保留原因

**預估工時**: 2-3 小時

---

#### Issue #2: 版本選擇 Modal 雙重疊加

**問題描述**:
```tsx
// App.tsx 中的問題程式碼
{showWelcome && <WelcomeModal ... />}
{showVersionModal && (
  <div className="fixed inset-0 z-50 ...">
    <WelcomeModal ... />  {/* 同一個 Modal 被使用兩次 */}
  </div>
)}
```

**受影響檔案**:
- `src/App.tsx` (行 132-164)
- `src/components/modals/WelcomeModal.tsx`

**根本原因**:
- 初次版本選擇與重新選擇版本使用不同的觸發邏輯
- 導致需要兩個 state (`showWelcome`, `showVersionModal`) 管理同一個 Modal

**建議解決方案**:

```typescript
// 統一為單一 Modal state
const [versionModalState, setVersionModalState] = useState<'hidden' | 'first-time' | 'reselect'>('hidden');

useEffect(() => {
  if (!userSettings && data.length > 0) {
    setVersionModalState('first-time');
  } else if (userSettings && !VersionService.isValidSelection(...)) {
    setVersionModalState('reselect');
  }
}, [userSettings, data.length]);

// 渲染邏輯
{versionModalState !== 'hidden' && (
  <WelcomeModal
    mode={versionModalState}
    setUserSettings={setUserSettings}
    onClose={() => {
      if (VersionService.isValidSelection(...)) {
        setVersionModalState('hidden');
      }
    }}
  />
)}
```

**預估工時**: 1-2 小時

---

#### Issue #3: useDataset 中的複雜資料處理邏輯

**問題描述**:
- `useDataset.ts` 檔案長達 626 行
- `importRows` 函數過於複雜 (470+ 行)
- 包含多層 if-else 巢狀和資料正規化邏輯
- 難以測試和維護

**受影響檔案**:
- `src/hooks/useDataset.ts`

**根本原因**:
- 從單一 HTML 檔案遷移時，將所有邏輯放在一個 hook 中
- 資料來源解析、正規化、合併邏輯混在一起

**建議解決方案**:

```typescript
// 分離關注點
// src/utils/dataParser.ts
export function parseWordFromRaw(raw: any): VocabularyWord {
  // 處理欄位對應、POS 解析、textbook_index 解析
}

// src/utils/dataNormalizer.ts
export function normalizeWord(word: VocabularyWord): VocabularyWord {
  // 處理 word_forms_detail、theme、affix_info 正規化
}

// src/utils/dataMerger.ts
export function mergeWords(existing: VocabularyWord, incoming: VocabularyWord): VocabularyWord {
  // 處理兩個單字資料的合併邏輯
}

// 簡化後的 useDataset.ts
const importRows = (items: any[], opts: ImportOptions) => {
  const stats = { ... };

  setData(current => {
    const incoming = items
      .map(parseWordFromRaw)
      .map(normalizeWord);

    const merged = mergeDatasets(current, incoming, opts);
    return merged;
  });

  return stats;
};
```

**預估工時**: 4-6 小時

---

### 2.2 Architecture Issues

#### Issue #4: 資料流程不明確

**問題描述**:

```
App.tsx
  └─ useDataset() ─────┐
  └─ userSettings ─────┤
                       │
                       ├─> HomePage
                       │    └─ filterWords(data, userSettings, ...)
                       │
                       ├─> FavoritesPage (words prop)
                       └─> Quiz Pages (words prop)
```

- `data` 在 App.tsx 層級載入，但向下傳遞給多個元件
- `userSettings` 同時在多個地方使用（App, HomePage, filterWords）
- 缺乏統一的 state management

**根本原因**:
- 從單一 HTML 遷移，保留了全域 state 的思維
- 未使用 Context API 或 Redux 等狀態管理

**建議解決方案**:

**選項 A - React Context** (推薦):
```typescript
// src/contexts/AppContext.tsx
export const AppContext = createContext<{
  data: VocabularyWord[];
  userSettings: UserSettings | null;
  setUserSettings: (settings: UserSettings) => void;
}>(null!);

// App.tsx
<AppContext.Provider value={{ data, userSettings, setUserSettings }}>
  <Shell>
    {renderContent()}
  </Shell>
</AppContext.Provider>

// HomePage.tsx
const { data, userSettings } = useContext(AppContext);
```

**選項 B - 維持 prop drilling** (如果不打算大改):
- 明確記錄 data flow
- 加入 TypeScript 嚴格型別

**預估工時**: 3-4 小時 (選項 A)

---

#### Issue #5: localStorage 直接操作分散各處

**問題描述**:
- `useFavorites`, `useQuizHistory`, `useUserSettings`, `useCurrentTab` 等 hooks 都直接操作 localStorage
- 缺乏統一的 storage abstraction layer
- localStorage quota 錯誤處理不一致

**受影響檔案**:
```
src/hooks/useFavorites.ts
src/hooks/useQuizHistory.ts
src/hooks/useUserSettings.ts
src/hooks/useCurrentTab.ts
src/hooks/useFilters.ts
src/types/index.ts (LS 常數定義)
```

**建議解決方案**:

```typescript
// src/utils/storage.ts
class LocalStorage {
  private static compress = true;

  static get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;

      const parsed = this.compress
        ? JSON.parse(LZString.decompress(raw) || '{}')
        : JSON.parse(raw);

      return parsed;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      const data = this.compress ? LZString.compress(json) : json;
      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      return false;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}

// 使用方式
import { LocalStorage } from '../utils/storage';
const favorites = LocalStorage.get(LS.favorites, []);
LocalStorage.set(LS.favorites, Array.from(favoritesSet));
```

**預估工時**: 2-3 小時

---

### 2.3 Data Quality Issues

#### Issue #6: textbook_index 資料正規化不完整

**問題描述**:
- `textbook_index` 欄位解析複雜（格式: "龍騰-B1-U4; 翰林-B2-L3"）
- 版本名稱有時包含「版」字（龍騰版 vs 龍騰）
- `VersionService.normalize()` 的使用不一致

**受影響檔案**:
```
src/hooks/useDataset.ts (行 266-294)
src/utils/filterWords.ts (行 25-33)
src/services/VersionService.ts
```

**範例資料問題**:
```typescript
// 資料可能的格式
textbook_index: [
  { version: "龍騰", vol: "B1", lesson: "U4" },
  { version: "龍騰版", vol: "B1", lesson: "U4" },  // ❌ 不一致
]

// 比對時
userSettings.version = "龍騰"
item.version = "龍騰版"  // ❌ 比對失敗
```

**建議解決方案**:

```typescript
// 1. 在資料匯入時統一正規化
// src/hooks/useDataset.ts
parsedTextbookIndex.push({
  version: VersionService.normalize(parts[0]),  // ✅ 移除「版」字
  vol: parts[1],
  lesson: parts[2]
});

// 2. 確保所有比對都使用正規化版本
// src/utils/filterWords.ts
const normalizedUserVersion = VersionService.normalize(userSettings.version);
const normalizedItemVersion = VersionService.normalize(item.version);
if (normalizedItemVersion !== normalizedUserVersion) {
  match = false;
}

// 3. 加入資料驗證測試
describe('textbook_index normalization', () => {
  test('should normalize version names', () => {
    expect(VersionService.normalize('龍騰版')).toBe('龍騰');
    expect(VersionService.normalize('三民版')).toBe('三民');
  });
});
```

**預估工時**: 2 小時

---

#### Issue #7: 未使用的檔案和程式碼

**問題描述**:
- Git status 顯示已刪除的檔案（TODO.md, googleSheet.ts, googleSheetLoader.ts）
- 仍有殘留的 Google Sheets 相關註解
- 未使用的 import statements

**受影響檔案**:
```bash
D TODO.md
D src/config/googleSheet.ts
D src/services/googleSheetLoader.ts
D screenshot-textbook-debug.png
D playwright-report/data/c080dd9e2b9994e836b785d80652234d9502c2c9.md
```

**建議解決方案**:

```bash
# 1. 清理 Git staging area
git add -A
git commit -m "chore: Remove unused files and cleanup Google Sheets references"

# 2. 檢查未使用的 imports
npx depcheck  # 找出未使用的依賴

# 3. 移除註解中的 "Removed Google Sheet imports" 等
# 直接刪除這些註解，程式碼已經完全遷移

# 4. 清理測試檔案
rm -rf playwright-report/  # 不應 commit 測試報告
```

**預估工時**: 1 小時

---

## 3. 重構計劃

### Phase 1: 急迫修復（1-2 天）

**目標**: 解決 P1 問題，提升程式碼品質

#### Task 1.1: 統一 Logging 策略

- [ ] 建立 `src/utils/logger.ts`
- [ ] 實作環境區分的 logging 函數
- [ ] 替換所有 `console.log` 為 `logger.log()`
- [ ] 移除所有 `// Removed logging` 註解
- [ ] 更新 ESLint 規則禁止直接使用 `console.log`

**預估**: 3 小時

#### Task 1.2: 簡化版本選擇流程

- [ ] 重構 `App.tsx` 中的版本選擇邏輯
- [ ] 合併 `showWelcome` 和 `showVersionModal` 為單一 state
- [ ] 更新 `WelcomeModal` 支援不同模式
- [ ] 加入 E2E 測試驗證流程

**預估**: 2 小時

#### Task 1.3: 清理未使用的程式碼

- [ ] Commit 已刪除的檔案
- [ ] 移除 Google Sheets 相關註解
- [ ] 執行 `depcheck` 檢查未使用的依賴
- [ ] 更新 `.gitignore` 排除測試報告

**預估**: 1 小時

**Phase 1 總計**: 6 小時 (約 1 天)

---

### Phase 2: 架構優化（3-5 天）

**目標**: 改善程式碼架構，提升可維護性

#### Task 2.1: 重構 useDataset Hook

- [ ] 建立 `src/utils/dataParser.ts` - 處理原始資料解析
- [ ] 建立 `src/utils/dataNormalizer.ts` - 處理資料正規化
- [ ] 建立 `src/utils/dataMerger.ts` - 處理資料合併
- [ ] 簡化 `useDataset.ts` 中的 `importRows` 函數
- [ ] 加入 Unit Tests 覆蓋所有新的 utility 函數
- [ ] 驗證資料正確性（特別是 exam_tags, textbook_index）

**預估**: 6 小時

#### Task 2.2: 統一 localStorage 操作

- [ ] 建立 `src/utils/storage.ts` 抽象層
- [ ] 實作 get/set/remove 方法，包含壓縮和錯誤處理
- [ ] 重構所有 hooks 使用新的 storage API
- [ ] 加入 storage quota 錯誤處理
- [ ] 更新測試以 mock storage layer

**預估**: 3 小時

#### Task 2.3: 引入 React Context

- [ ] 建立 `src/contexts/AppContext.tsx`
- [ ] 移動 `data` 和 `userSettings` 到 Context
- [ ] 重構 `App.tsx`, `HomePage.tsx`, `FavoritesPage.tsx` 使用 Context
- [ ] 移除不必要的 prop drilling
- [ ] 更新所有相關測試

**預估**: 4 小時

#### Task 2.4: 正規化 textbook_index

- [ ] 確保 `importRows` 中所有 version 都經過 normalize
- [ ] 更新 `filterWords` 確保一致的版本比對
- [ ] 加入資料驗證測試
- [ ] 檢查現有資料是否需要 migration

**預估**: 2 小時

**Phase 2 總計**: 15 小時 (約 2 天)

---

### Phase 3: 效能優化（1 週）

**目標**: 減少 Bundle Size，提升載入速度

#### Task 3.1: Bundle Size 分析

- [ ] 執行 `vite-bundle-visualizer`
- [ ] 識別最大的依賴套件
- [ ] 檢查是否有未使用的依賴
- [ ] 評估 tree-shaking 效果

**預估**: 2 小時

#### Task 3.2: 依賴優化

**可能的優化項目**:

| 套件 | 當前大小 | 優化方案 | 預期縮減 |
|------|---------|---------|---------|
| uuid | ~70KB | 自行實作簡單版本 | -50KB |
| lz-string | ~20KB | 考慮 pako (更高壓縮率) | 0 (保持) |
| 未使用的 @babel/* | ? | 檢查 Vite config | -100KB? |

- [ ] 移除 `uuid` 改用自行實作
- [ ] 檢查是否有重複的依賴
- [ ] 優化 Tailwind CSS purge 設定
- [ ] 考慮 Dynamic Import（但會犧牲 single HTML 優勢）

**預估**: 4 小時

#### Task 3.3: 程式碼優化

- [ ] 移除所有未使用的 imports
- [ ] 合併重複的 utility 函數
- [ ] 優化 React 元件的 re-render (使用 React.memo)
- [ ] 加入 performance monitoring

**預估**: 3 小時

**Phase 3 總計**: 9 小時 (約 1-2 天)

---

## 4. 技術債

### 4.1 已知的 Workarounds

#### Workaround #1: SessionStorage 用於測驗完成狀態

**位置**: `FlashcardQuiz.tsx`, `MultipleChoiceQuiz.tsx`

```typescript
// 使用 sessionStorage 避免重新整理後丟失測驗結果
sessionStorage.setItem('quiz_completed_state', JSON.stringify({
  type: 'flashcard',
  timestamp: Date.now()
}));
```

**問題**:
- SessionStorage 在分頁關閉後會清空
- 應該整合到 `useQuizHistory` 中
- 1 小時的時效檢查過於任意

**建議改進**:
```typescript
// 加入到 QuizRecord 中
interface QuizRecord {
  // ...existing fields
  isCompleted: boolean;
  completedAt?: string;
}

// useQuizHistory 提供方法
const { getLatestIncomplete, markComplete } = useQuizHistory();
```

**優先級**: P2
**預估工時**: 2 小時

---

#### Workaround #2: Type Assertions in Quiz Components

**位置**: 多個測驗元件

```typescript
// 需要手動轉型
const favoritesApi = {
  favorites: Array.from(favorites),  // Set -> Array
  toggle: (id: number) => { ... }
};
```

**問題**:
- `useFavorites` 回傳 `Set<number>`，但元件需要 `number[]`
- 每個元件都要做轉換

**建議改進**:
```typescript
// useFavorites.ts
export function useFavorites() {
  // ... existing code
  return {
    favorites,
    favoritesArray: Array.from(favorites),  // ✅ 提供 array 版本
    // ...
  };
}
```

**優先級**: P2
**預估工時**: 1 小時

---

#### Workaround #3: 複雜的 Type Guards

**位置**: `WordDetailPage.tsx`

```typescript
// Type guard for affix_info
const affixInfo = typeof word.affix_info === 'object' ? word.affix_info : null;
```

**問題**:
- `affix_info` 可以是 `string | object`
- 應該在資料層統一正規化

**建議改進**:
```typescript
// 在 dataNormalizer.ts 統一處理
function normalizeAffixInfo(raw: string | AffixInfo | undefined): AffixInfo | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    return parseAffixString(raw);  // 解析字串格式
  }
  return raw;
}
```

**優先級**: P2
**預估工時**: 1 小時

---

### 4.2 需要改進的模式

#### Pattern #1: Props Drilling

**範例**:
```
App.tsx
  └─ words ─────> HomePage
                  └─ words ─────> LazyWordCard
```

**改進方向**: 已在 Phase 2 Task 2.3 規劃（引入 React Context）

---

#### Pattern #2: 直接修改 DOM (Imperative)

**範例**: `WelcomeModal.tsx`, `Shell.tsx`

```typescript
window.location.hash = '#/quiz';  // ❌ 直接修改 URL
```

**建議改進**:
```typescript
// 建立 useNavigate hook
const { navigate } = useHashRoute();
navigate('/quiz');  // ✅ 宣告式導航
```

**優先級**: P2
**預估工時**: 2 小時

---

### 4.3 測試覆蓋率不足

| 測試類型 | 當前狀況 | 目標 |
|---------|---------|------|
| Unit Tests | ❌ 0% | 60%+ |
| Integration Tests | ⚠️ 部分 hooks | 80%+ |
| E2E Tests | ✅ 良好 | 保持 |

**需要加入的 Unit Tests**:

1. **Utility Functions**
   - [ ] `dataParser.ts` - 資料解析邏輯
   - [ ] `dataNormalizer.ts` - 正規化邏輯
   - [ ] `filterWords.ts` - 篩選邏輯
   - [ ] `quizHelpers.ts` - 測驗輔助函數
   - [ ] `versionExtraction.ts` - 版本提取

2. **Services**
   - [ ] `VersionService.ts` - 版本驗證邏輯

3. **Hooks**
   - [ ] `useDataset.ts` - 資料載入和合併
   - [ ] `useFavorites.ts` - 收藏管理
   - [ ] `useQuizHistory.ts` - 測驗歷史

**工具設定**:
- 已安裝: Vitest (via package.json)
- 需設定: `vitest.config.ts`
- 需加入: `@testing-library/react-hooks`

**預估工時**: 8-10 小時

---

## 5. PRD 對照

### 5.1 已實作的功能

| PRD 章節 | 功能 | 完成度 | 備註 |
|---------|------|--------|------|
| 2.1.1 | 版本選擇機制 | ✅ 100% | 功能完整，UX 可優化 |
| 2.1.2 | 課本進度篩選 | ✅ 95% | 高中/國中冊次、課次選擇正常 |
| 2.1.2 | 大考衝刺篩選 | ✅ 90% | 年份選擇正常，需驗證 exam_tags 資料 |
| 2.1.2 | 主題探索篩選 | ✅ 95% | 國中 theme_index、高中 level/themes 分流正確 |
| 2.1.3 | 第二層詞性快篩 | ✅ 100% | QuickPOSFilter 元件完整 |
| 2.1.4 | 關鍵字搜尋 | ✅ 100% | 即時搜尋正常 |
| 2.2 | 重點訓練 (Favorites) | ✅ 100% | 功能完整 |
| 2.3 | 選擇題測驗 | ✅ 95% | 選項分佈已優化 |
| 2.3 | 閃卡測驗 | ✅ 95% | 翻卡動畫、狀態管理完善 |
| 2.4 | 單字詳情頁 | ✅ 100% | 完整顯示所有欄位 |
| 2.5 | 測驗歷史紀錄 | ✅ 100% | 資料持久化正常 |

### 5.2 部分實作的功能

| 功能 | 缺少的部分 | 優先級 | 預估工時 |
|------|----------|--------|---------|
| 版本選擇 UX | Logo 顯示、動畫效果 | P2 | 2h |
| 詞性快篩 | 統計數量顯示 | P2 | 1h |
| 測驗結果 | 匯出功能 | P2 | 3h |
| 單字詳情 | 發音檔案播放（TTS only） | P2 | - |

### 5.3 尚未實作的功能

| PRD 需求 | 說明 | 優先級 | 預估工時 |
|---------|------|--------|---------|
| BR-006 | CEFR 等級篩選 | P2 | 2h |
| - | 學習進度追蹤 | P3 | 8h |
| - | 社群分享功能 | P3 | - |
| - | 深色模式 | P3 | 4h |

### 5.4 與 PRD 的差異

#### 差異 #1: 版本選擇流程

**PRD 描述**:
```
首次進入 → 顯示歡迎畫面 → 選擇學程 → 選擇版本 → 開始使用
```

**實際實作**:
```
首次進入 → WelcomeModal (包含學程+版本選擇) → 開始使用
```

**評估**: ✅ 簡化流程，使用者體驗更好

---

#### 差異 #2: localStorage vs Google Sheets

**PRD 假設**: 資料從 Google Sheets 即時載入

**實際實作**:
- 資料打包在 `src/data/vocabulary.json`
- localStorage 僅用於使用者設定和收藏
- Google Sheets 整合已移除

**評估**: ✅ 符合 "offline-first" 需求，Bundle 內含所有資料

---

## 6. 執行優先級矩陣

### 6.1 Impact vs Effort Matrix

```
高影響 │
      │  [Phase 1.1]     │  [Phase 2.1]
      │  Logging 策略    │  重構 useDataset
      │                 │
影    │  [Phase 1.2]     │  [Phase 3.2]
響    │  Modal 流程      │  Bundle 優化
      │                 │
度    │                 │  [Phase 2.4]
      │  [Phase 1.3]     │  textbook_index
低影響│  清理程式碼       │  正規化
      └─────────────────┴──────────────────
         低工時           高工時
              工作量
```

### 6.2 建議執行順序

**Week 1 (Sprint 1)**:
1. ✅ Phase 1: 急迫修復 (6 小時)
   - Task 1.1: Logging 策略
   - Task 1.2: Modal 簡化
   - Task 1.3: 清理程式碼

**Week 2 (Sprint 2)**:
2. ✅ Phase 2.1-2.2: 架構優化 Part 1 (9 小時)
   - Task 2.1: 重構 useDataset
   - Task 2.2: localStorage 抽象層

**Week 3 (Sprint 3)**:
3. ✅ Phase 2.3-2.4: 架構優化 Part 2 (6 小時)
   - Task 2.3: React Context
   - Task 2.4: 資料正規化

**Week 4 (Sprint 4)**:
4. ⚠️ Phase 3: 效能優化 (9 小時)
   - Task 3.1: Bundle 分析
   - Task 3.2: 依賴優化
   - Task 3.3: 程式碼優化

5. 📝 Tech Debt Reduction (依優先級逐步進行)

---

## 7. 成功標準

### 7.1 程式碼品質指標

- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 無 warnings
- [ ] 無 `console.log` 在生產環境
- [ ] 無 `// Removed logging` 註解
- [ ] Unit Test 覆蓋率 > 60%

### 7.2 效能指標

- [ ] Bundle Size < 4 MB (目前 5.1 MB)
- [ ] Gzipped Size < 1.2 MB (目前 1.5 MB)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### 7.3 功能完整性

- [ ] 所有 PRD P0 功能正常運作
- [ ] 所有 E2E 測試通過
- [ ] 跨瀏覽器相容性 (Chrome, Safari, Firefox)
- [ ] 行動裝置響應式設計完善

---

## 8. 風險與緩解策略

### 風險 #1: 重構過程中破壞現有功能

**發生機率**: 中
**影響程度**: 高

**緩解策略**:
1. 每個 Phase 完成後執行完整的 E2E 測試
2. 建立 feature branches，逐步合併
3. 加入 regression tests
4. Code review 機制

---

### 風險 #2: Bundle Size 優化效果不如預期

**發生機率**: 中
**影響程度**: 中

**緩解策略**:
1. 先執行 bundle analysis，確認優化方向
2. 設定明確的目標（如減少 20%）
3. 考慮 alternative: 接受較大的 bundle size（single HTML 的 trade-off）

---

### 風險 #3: 測試撰寫時間超出預估

**發生機率**: 高
**影響程度**: 低

**緩解策略**:
1. 優先測試關鍵路徑（資料處理、篩選邏輯）
2. 使用測試框架的 snapshot testing 加速
3. 可延後非關鍵元件的測試

---

## 9. 下一步行動

### 立即執行 (本週)

1. **技術決策會議** (1 小時)
   - 確認是否引入 React Context
   - 確認 Bundle Size 優化目標
   - 決定 Unit Tests 的範圍

2. **開始 Phase 1** (6 小時)
   - 指派 Task 1.1, 1.2, 1.3
   - 建立 feature branch: `refactor/phase-1-quick-fixes`
   - 設定 daily standup 追蹤進度

### 短期 (2 週內)

3. **完成 Phase 1 & Phase 2**
   - 每個 Task 完成後進行 code review
   - 更新測試確保無 regression
   - 記錄遇到的問題和解決方案

### 中期 (1 個月內)

4. **Phase 3 效能優化**
   - 測量優化前後的效能差異
   - 撰寫效能優化報告
   - 更新文件

5. **Tech Debt 持續改善**
   - 每週選擇 1-2 個 P2 問題解決
   - 逐步提升測試覆蓋率

---

## 附錄 A: 檔案清單

### 核心檔案 (需重點關注)

```
src/
├── App.tsx                          ⚠️ 版本選擇流程需簡化
├── hooks/
│   ├── useDataset.ts                🔴 需重構 (626 行)
│   ├── useFavorites.ts              ✅ 狀態良好
│   ├── useQuizHistory.ts            ✅ 狀態良好
│   └── useUserSettings.ts           ✅ 狀態良好
├── utils/
│   ├── filterWords.ts               ⚠️ 需加入測試
│   ├── dataProcessing.ts            ⚠️ 需加入測試
│   └── quizHelpers.ts               ✅ 狀態良好
├── services/
│   └── VersionService.ts            ✅ 狀態良好，需加測試
└── components/
    ├── pages/
    │   ├── HomePage.tsx             ⚠️ 需改用 Context
    │   ├── FavoritesPage.tsx        ✅ 已修復
    │   └── WordDetailPage.tsx       ✅ 狀態良好
    └── quiz/
        ├── MultipleChoiceQuiz.tsx   ✅ 狀態良好
        └── FlashcardQuiz.tsx        ✅ 狀態良好
```

---

## 附錄 B: 命名規範

### 檔案命名

- React 元件: PascalCase (e.g., `HomePage.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useDataset.ts`)
- Utilities: camelCase (e.g., `filterWords.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `LS` in types/index.ts)

### 變數命名

```typescript
// ✅ Good
const userSettings: UserSettings = { ... };
const filteredWords = filterWords(words, settings);
const isValid = VersionService.validate(version, stage);

// ❌ Bad
const us = { ... };
const fw = filter(w, s);
const valid = validate(v, s);
```

---

## 附錄 C: Git Commit 規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/)

```bash
# 格式
<type>(<scope>): <subject>

# 範例
feat(quiz): add answer distribution optimization
fix(favorites): resolve race condition on page load
refactor(hooks): extract data parsing logic from useDataset
test(utils): add unit tests for filterWords
chore(deps): remove unused uuid dependency
docs(readme): update architecture documentation
```

**Type 類型**:
- `feat`: 新功能
- `fix`: Bug 修復
- `refactor`: 重構（不改變功能）
- `test`: 測試相關
- `chore`: 工具/配置變更
- `docs`: 文件更新
- `style`: 程式碼格式（不影響功能）
- `perf`: 效能優化

---

## 附錄 D: 聯絡資訊

**專案負責人**: Development Team
**最後更新**: 2025-12-20
**文件版本**: 1.0

**相關文件**:
- [PRD.md](./PRD.md) - 產品需求文件
- [CLAUDE.md](./CLAUDE.md) - 專案開發規範

---

**註**: 本重構計劃為 living document，應隨著專案進展持續更新。
