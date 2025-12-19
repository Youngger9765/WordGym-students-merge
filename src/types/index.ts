export interface VocabularyWord {
  id: number;
  english_word: string;
  chinese_definition: string;
  english: string;
  level?: string;
  stage?: string;  // Learning stage
  cefr?: string;  // Common European Framework Reference

  // Optional fields commonly used across the app
  languageExamples?: string[];
  textbook_index?: Array<{ version: string; vol: string; lesson: string }>;
  exam_tags?: string[];
  theme_index?: Array<{ range: string; theme: string }>;
  theme?: string;  // Primary theme
  themes?: string[];
  version?: string;
  vol?: string;
  lesson?: string;
  range?: string;
  year?: string;
  phrases?: string[];

  // Grammar and linguistic details
  kk_phonetic?: string;
  posTags?: string[];
  grammar_main_category?: string;
  grammar_sub_category?: string;
  grammar_function?: string;
  applicable_sentence_pattern?: string;
  word_forms?: string | {
    base: string[];
    idiom: string[];
    compound: string[];
    derivation: string[];
  };
  pos?: POSType;

  // Example and context information
  example_sentence?: string;
  example_sentence_2?: string;
  example_translation?: string;
  example_translation_2?: string;

  // Lexical relations
  synonyms?: string[];
  antonyms?: string[];
  confusables?: string[];
  affix_info?: string | {
    prefix?: string;
    root?: string;
    suffix?: string;
    meaningChange?: string;
    meaning?: string;
    example?: string;
  };
}

export type POSType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'pronoun' | 'other';

export const POS_LABEL: Record<POSType, string> = {
  noun: '名詞',
  verb: '動詞',
  adjective: '形容詞',
  adverb: '副詞',
  preposition: '介係詞',
  conjunction: '連接詞',
  interjection: '感嘆詞',
  pronoun: '代名詞',
  other: '其他'
};

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizRecord {
  id?: string;
  quizType: 'multiple_choice' | 'flashcard';
  totalQuestions: number;
  correctAnswers: number;
  timestamp: number;
  date?: number;
  words: string[];
  difficulty: QuizDifficulty;
  score: number;
  wrong: number;
  learning: number;
  mastered: number;
  correct?: number;
}

export interface QuizConfiguration {
  type: 'multiple_choice' | 'flashcard';
  difficulty: QuizDifficulty;
  category?: 'textbook' | 'theme' | 'all';
}

export interface TextbookIndexItem {
  name: string;
  words: VocabularyWord[];
  version?: string;
  vol?: string;
  lesson?: string;
}

export interface ThemeIndexItem {
  name: string;
  words: VocabularyWord[];
  range?: string;
  theme?: string;
}

export interface UserSettings {
  name?: string;
  level?: string;
  focusedThemes?: string[];
  dailyTarget?: number;
  stage?: string;
  version?: string;
}

export interface ExportSections {
  title: string;
  content: string;
  pos?: POSType;
  relations?: string[];
  affix?: string;
  prefix?: string;
  suffix?: string;
}

export interface WordFormsDetail {
  base: string[];
  past?: string[];
  present?: string[];
  gerund?: string[];
  idiom?: string[];
  compound?: string[];
  derivation?: string[];
}

export interface AffixInfo {
  prefix?: string;
  root?: string;
  suffix?: string;
  meaningChange?: string;
  meaning?: string;
  example?: string;
}

export type NavigationRoute = 'home' | 'favorites' | 'quiz' | 'word' | '404';

export type CurrentTab = 'exam' | 'theme' | 'textbook';

export interface Filters {
  exam_tags?: string[];
  theme_index?: string[];
  stage?: string;
  version?: string;
  pos?: POSType[];

  // Nested objects for tab-specific filters
  textbook?: { vol?: string; lesson?: string };
  exam?: { year?: string };
  theme?: { range?: string; theme?: string };

  // Backward compatibility - keep flat fields
  vol?: string;
  lesson?: string;
  year?: string;
  range?: string;

  // Other miscellaneous filters
  cefr?: string[];
}

export interface QuizAnswer {
  word: VocabularyWord;
  userAnswer: string;
  userAnswerDefinition?: string;
  isCorrect: boolean;
  correctAnswer?: string;
  question?: string;
  wordDefinition?: string;
  sentenceTranslation?: string;
  wordId?: number;
}
export interface FilterOptions {
  searchTerm?: string;
  posFilter?: string;
  levelFilter?: string;
  themeFilter?: string;
  textbook?: { vol?: string; lesson?: string };
  exam?: { year?: string };
  theme?: { range?: string; theme?: string };
}

export interface UserExample {
  id: string;
  sentence: string;
  translation?: string;
  source: 'user' | 'ai' | 'imported';
  createdAt: string;
}

export interface UserExamplesStore {
  [wordId: number]: UserExample[];
}

export interface ImportStats {
  added: number;
  merged: number;
  replaced: number;
  tagsAdded: Record<string, number>;
  totalBefore: number;
  totalAfter: number;
}

export interface ImportOptions {
  overrideExamples?: boolean;
  replace?: boolean;
}

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
