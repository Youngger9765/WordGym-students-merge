/**
 * WordGym Complete Type Definitions
 * Migrated from index.html (5542 lines)
 */

// ============= Core Types =============

export type POSType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'other';

export const POS_LABEL: Record<POSType, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  pronoun: '代名詞',
  preposition: '介系詞',
  conjunction: '連接詞',
  other: '其他'
};

export const ALL_POS: POSType[] = Object.keys(POS_LABEL) as POSType[];

// ============= Theme Types =============

export interface ThemeLabel {
  [key: string]: string;
}

export const THEME_LABEL: ThemeLabel = {
  highschool_climate: '高中氣候',
  junior_high: '國中單字'
};

export const ALL_THEMES = Object.keys(THEME_LABEL);

// ============= Word Forms Detail =============

export interface WordFormsDetail {
  base: string[];
  idiom: string[];
  compound: string[];
  derivation: string[];
}

// ============= Affix Info =============

export interface AffixInfo {
  prefix: string;
  root: string;
  suffix: string;
  meaning: string;
  example: string;
}

// ============= Textbook Index =============

export interface TextbookIndexItem {
  version: string;  // 版本：康軒、龍騰等
  vol: string;      // 冊次：B1, B2 等
  lesson: string;   // 課次：L1, L2, U1, U2 等
}

// ============= Theme Index =============

export interface ThemeIndexItem {
  range: string;   // 1200 或 800（國中），Level 4/5/6（高中）
  theme: string;   // family, climate 等主題
}

// ============= Vocabulary Word =============

export interface VocabularyWord {
  id: number;
  english_word: string;
  kk_phonetic?: string;
  chinese_definition?: string;

  // POS and Grammar
  posTags: POSType[];
  basic_pos?: string;
  grammar_main_category?: string;
  grammar_sub_category?: string;
  grammar_function?: string;
  applicable_sentence_pattern?: string;

  // Examples (up to 5)
  example_sentence?: string;
  example_translation?: string;
  example_sentence_2?: string;
  example_translation_2?: string;
  example_sentence_3?: string;
  example_translation_3?: string;
  example_sentence_4?: string;
  example_translation_4?: string;
  example_sentence_5?: string;
  example_translation_5?: string;
  example_source_2?: string;  // Format: "year\tpart\tsource"

  // Themes and Levels
  theme?: string;
  themes: string[];
  theme_order?: Record<string, number>;
  level?: string;
  cefr?: string;

  // Word Forms and Relations
  word_forms?: string;
  word_forms_detail: WordFormsDetail;
  derivatives?: string[];
  synonyms?: string[];
  antonyms?: string[];
  confusables?: string[];
  phrases?: string[];

  // Affix Information
  affix_info?: AffixInfo;

  // New Fields for Enhanced Filtering
  stage?: 'junior' | 'senior' | null;  // 國中/高中
  textbook_index: TextbookIndexItem[];  // 課本索引陣列
  exam_tags: string[];                   // 大考標籤（例如：108學測、109會考）
  theme_index: ThemeIndexItem[];         // 主題索引陣列

  // Multimedia
  videoUrl?: string;
}

// ============= User Settings =============

export interface UserSettings {
  stage: 'junior' | 'senior';  // 學程
  version: string;              // 課本版本（康軒、翰林、龍騰等）
}

// ============= Filter Types =============

export interface TextbookFilter {
  vol?: string;     // 冊次
  lesson?: string;  // 課次
}

export interface ExamFilter {
  year?: string;    // 年份（例如：108學測、109會考）
}

export interface ThemeFilter {
  range?: string;   // 程度範圍（1200/800 或 Level 4/5/6）
  theme?: string;   // 主題分類
}

export interface Filters {
  textbook: TextbookFilter;
  exam: ExamFilter;
  theme: ThemeFilter;
}

export type CurrentTab = 'textbook' | 'exam' | 'theme';

// ============= User Examples =============

export interface UserExample {
  sentence: string;
  translation: string;
  source: 'user';
  createdAt: string;
}

export interface UserExamplesStore {
  [wordId: number]: UserExample[];
}

// ============= Quiz Types =============

export interface QuizAnswer {
  wordId: number;
  word: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  question?: string;
  translation?: string;
  wordDefinition?: string;
  sentenceTranslation?: string;
  userAnswerDefinition?: string;
}

export interface QuizRecord {
  id: string;
  date: string;
  type: 'multiple-choice' | 'flashcard';
  totalQuestions: number;
  correct: number;
  wrong: number;
  learning: number;
  wrongWords: Array<{
    wordId: number;
    word: string;
    correctAnswer?: string;
    userAnswer?: string;
    question?: string;
    chinese_definition?: string;
    sentenceTranslation?: string;
    userAnswerDefinition?: string;
  }>;
  learningWords: Array<{
    wordId: number;
    word: string;
  }>;
  correctWords: number[];
  duration: number;
  mode: string | null;
}

// ============= Google Sheets Config =============

export interface GoogleSheetConfig {
  name: string;
  sheetId: string;
  gid: string;
  theme: string;
}

export interface GoogleSheetsConfig {
  enabled: boolean;
  showImporter: boolean;
  sheets: GoogleSheetConfig[];
}

// ============= CSV Source =============

export interface CSVSource {
  url?: string;
  urls?: string[];
  embeddedText?: string;
  defaults?: {
    theme?: string;
  };
  limit?: number;
}

// ============= Import Options =============

export interface ImportOptions {
  overrideExamples: boolean;
  replace: boolean;
}

export interface ImportStats {
  added: number;
  merged: number;
  replaced: number;
  tagsAdded: Record<string, number>;
  totalBefore: number;
  totalAfter: number;
}

// ============= LocalStorage Keys =============

export const LS = {
  favorites: 'mvp_vocab_favorites',
  dataset: 'mvp_vocab_dataset_v36',
  presetApplied: 'mvp_vocab_preset_applied_v36',
  homeFilters: 'mvp_home_filters_v1',
  userExamples: 'mvp_vocab_user_examples_v1',
  quizHistory: 'mvp_vocab_quiz_history_v1',
  userName: 'mvp_vocab_user_name_v1',
  userSettings: 'wordgym_user_settings_v1',
  currentTab: 'wordgym_current_tab_v1',
  filters: 'wordgym_filters_v1',
  quickFilterPos: 'wordgym_quick_filter_pos_v1'
} as const;

// ============= Export Sections =============

export interface ExportSections {
  pos: boolean;
  relations: boolean;
  affix: boolean;
}

// ============= Route Types =============

export type RouteType =
  | 'home'
  | 'category'
  | 'word'
  | 'favorites'
  | 'quiz-history'
  | 'quiz';

export interface NavHistory {
  current: {
    route: RouteType;
    param: string | null;
  };
  previous: {
    route: RouteType;
    param: string | null;
  } | null;
}

// ============= Filter Options =============

export interface FilterOptions {
  searchTerm: string;
  posFilter: POSType | 'all';
  levelFilter: string;
  themeFilter: string;
}
