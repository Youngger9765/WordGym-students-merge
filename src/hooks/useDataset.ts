/**
 * useDataset Hook - Core Data Management
 * Migrated from index.html lines 841-1410
 * Handles dataset loading, merging, and persistence
 */

import { useState, useEffect, useRef } from 'react';
import LZString from 'lz-string';
import type { VocabularyWord, ImportStats, ImportOptions, LS as LSType } from '../types';
import {
  normalizePOS,
  multiSplit,
  dedupeList,
  mergeThemes,
  normalizeWordFormsDetail,
  mergeWordFormsDetail,
  mergeAffixInfo,
  toList,
  getWordThemes
} from '../utils/dataProcessing';
import { exampleFor, translationFor } from '../utils/wordUtils';
import { PRESET_VERSION } from '../config/googleSheet';

const LS: typeof LSType = {
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
};

/**
 * Ensure word has properly formatted word_forms_detail and theme
 */
function ensureWordFormsDetail(word: any): VocabularyWord {
  const detail = normalizeWordFormsDetail(word.word_forms_detail, word.word_forms, word.english_word);
  const themeList = mergeThemes(word.themes, word.theme);
  const primaryTheme = themeList.length ? themeList[0] : (String(word.theme || '').trim() || '');

  return {
    ...word,
    word_forms_detail: detail,
    theme: primaryTheme,
    themes: themeList
  };
}

/**
 * Apply theme ordering to word
 */
function applyThemeOrder(
  word: VocabularyWord & { theme_order?: Record<string, number> },
  themes: string[],
  counters: Record<string, number>
): VocabularyWord {
  if (!word.theme_order) word.theme_order = {};

  themes.forEach(theme => {
    const key = String(theme || '').trim();
    if (!key) return;
    if (word.theme_order![key] === undefined) {
      const idx = counters[key] ?? 0;
      word.theme_order![key] = idx;
      counters[key] = idx + 1;
    }
  });

  return word;
}

/**
 * Main useDataset hook
 */
export function useDataset(initialData: VocabularyWord[] = []) {
  const themeOrderRef = useRef<Record<string, number>>({});

  /**
   * Hydrate dataset with theme ordering
   */
  const hydrateDataset = (items: any[], resetCounters = true): VocabularyWord[] => {
    const counters = resetCounters ? {} : { ...themeOrderRef.current };
    const hydrated = (Array.isArray(items) ? items : []).map(item => {
      const prepared = ensureWordFormsDetail(item);
      const clone: any = { ...prepared };

      if (clone.theme_order && typeof clone.theme_order === 'object') {
        Object.entries(clone.theme_order).forEach(([theme, order]) => {
          const num = Number(order);
          if (Number.isFinite(num) && num >= 0) {
            counters[theme] = Math.max(counters[theme] || 0, num + 1);
          }
        });
      }
      applyThemeOrder(clone, getWordThemes(clone), counters);
      return clone;
    });

    themeOrderRef.current = counters;
    return hydrated;
  };

  /**
   * Initialize dataset from initialData only (localStorage disabled)
   * ALWAYS loads from Google Sheets on mount
   */
  const [data, setData] = useState<VocabularyWord[]>(() => {
    // REMOVED: localStorage loading logic to prevent caching issues
    // Always start with empty/initialData and load fresh from Google Sheets
    console.log('🔄 useDataset initialized - localStorage loading DISABLED');
    return hydrateDataset(initialData);
  });

  /**
   * Persist dataset to localStorage - DISABLED
   * Data is always loaded fresh from Google Sheets
   */
  // REMOVED: localStorage persistence to prevent caching issues
  // useEffect(() => {
  //   try {
  //     const jsonString = JSON.stringify(data);
  //     const compressed = LZString.compress(jsonString);
  //     localStorage.setItem(LS.dataset, compressed);
  //   } catch (e) {
  //     console.error('Failed to save dataset to localStorage:', e);
  //   }
  // }, [data]);

  /**
   * Import/merge rows into dataset
   */
  const importRows = (items: any[], opts: ImportOptions = { overrideExamples: false, replace: false }): ImportStats => {
    const overrideExamples = !!opts.overrideExamples;
    const replace = !!opts.replace;
    const stats: ImportStats = {
      added: 0,
      merged: 0,
      replaced: 0,
      tagsAdded: {},
      totalBefore: 0,
      totalAfter: 0
    };

    const incomingList = Array.isArray(items) ? items : [];

    setData(current => {
      stats.totalBefore = current.length;

      const baseCounters: Record<string, number> = {};
      const preparedCurrent = current.map(item => {
        const prepared = ensureWordFormsDetail(item);
        const clone: any = { ...prepared };
        applyThemeOrder(clone, getWordThemes(clone), baseCounters);
        return clone;
      });

      const counters = replace ? {} : baseCounters;
      if (replace) {
        stats.replaced = current.length;
      }
      themeOrderRef.current = counters;

      const next: VocabularyWord[] = replace ? [] : preparedCurrent;
      const byWord = new Map(next.map(w => [String(w.english_word || '').toLowerCase(), w]));
      let maxId = next.reduce((m, w) => Math.max(m, Number(w.id) || 0), 0);

      let skippedNoRaw = 0;
      let skippedNoEnglish = 0;
      let processedCount = 0;

      /**
       * Ensure tag is added to word
       */
      const ensureTag = (wordObj: any, tag: string) => {
        if (!tag) return;
        if (!wordObj.posTags) wordObj.posTags = [];
        if (!wordObj.posTags.includes(tag)) {
          wordObj.posTags = [...wordObj.posTags, tag];
          wordObj.basic_pos = wordObj.posTags.join(', ');
          stats.tagsAdded[tag] = (stats.tagsAdded[tag] || 0) + 1;
        }
      };

      incomingList.forEach((raw: any) => {
        if (!raw) {
          skippedNoRaw++;
          return;
        }

        const english = String(
          raw.english_word || raw.word || raw.Word || raw['英文'] || raw['英文單字'] || ''
        ).trim();
        if (!english) {
          skippedNoEnglish++;
          return;
        }

        processedCount++;

        // Parse POS tags
        const posSources = [
          raw.posTags,
          raw.basic_pos,
          raw.grammar_main_category,
          raw['詞性'],
          raw['詞性分類'],
          raw.pos
        ];
        const tagTokens: string[] = [];
        posSources.forEach(src => {
          if (!src) return;
          if (Array.isArray(src)) tagTokens.push(...src);
          else tagTokens.push(...multiSplit(src));
        });
        const tags = Array.from(new Set(tagTokens.map(normalizePOS).filter(Boolean)));
        if (!tags.length) tags.push('other');

        // Parse word forms
        const formsRaw = raw.word_forms ?? raw['詞性變化'];
        const formsForDetail = Array.isArray(formsRaw) ? formsRaw : multiSplit(formsRaw || '');
        const levelValue = raw.level ?? raw.Level ?? raw.LEVEL ?? raw['Level'] ?? raw['LEVEL'] ?? '';
        const level = String(levelValue || '').trim();
        const normalizedDetail = normalizeWordFormsDetail(raw.word_forms_detail, formsForDetail, english);

        // Parse themes
        let themes = mergeThemes(raw.themes, raw.theme, raw['主題'], raw.default_theme, raw.defaultTheme);
        if (!themes.length && tags.length) themes = mergeThemes(tags[0]);
        if (!themes.length) themes = ['general'];

        // Parse relations
        const derivatives = toList(raw.derivatives, raw['衍生詞']);
        const synonyms = toList(raw.synonyms, raw['同義字']);
        const antonyms = toList(raw.antonyms, raw['反義字']);
        const confusables = toList(raw.confusables, raw['易混淆字']);

        // Parse affix info
        const affixSource = raw.affix_info && typeof raw.affix_info === 'object' ? raw.affix_info : {};

        // Build incoming word object
        // Parse textbook_index - format: "龍騰-B1-U4" or "龍騰-B1-U4; 翰林-B2-L3" (semicolon separated)
        const textbookIndexRaw = (raw.textbook_index || raw.textbookIndex || raw['課本索引'] || '').trim();
        const parsedTextbookIndex: any[] = [];
        if (textbookIndexRaw) {
          const items = textbookIndexRaw.split(';').map((s: string) => s.trim()).filter(Boolean);
          items.forEach((item: string) => {
            const parts = item.split('-').map((s: string) => s.trim());
            if (parts.length >= 3) {
              parsedTextbookIndex.push({
                version: parts[0],  // 版本：龍騰、翰林等
                vol: parts[1],      // 冊次：B1, B2 等
                lesson: parts[2]    // 課次：L1, L2, U1, U2 等
              });
            }
          });
        }

        // Parse exam_tags - format: "106學測" or "106學測; 107學測" (semicolon separated)
        const examTagsRaw = (raw.exam_tags || '').trim();
        const parsedExamTags: string[] = examTagsRaw
          ? examTagsRaw.split(';').map((s: string) => s.trim()).filter(Boolean)
          : [];

        // Parse theme_index (could be JSON string, array, or empty)
        let parsedThemeIndex: any[] = [];
        if (Array.isArray(raw.theme_index)) {
          parsedThemeIndex = raw.theme_index;
        } else if (typeof raw.theme_index === 'string' && raw.theme_index.trim()) {
          try {
            const parsed = JSON.parse(raw.theme_index);
            parsedThemeIndex = Array.isArray(parsed) ? parsed : [];
          } catch {
            // If not valid JSON, ignore
          }
        }

        const incoming: any = ensureWordFormsDetail({
          id: null,
          english_word: english,
          kk_phonetic: raw.kk_phonetic || raw.KK || raw['KK音標'] || '',
          chinese_definition: raw.chinese_definition || raw['中譯'] || raw['中文'] || '',
          posTags: tags,
          basic_pos: tags.join(', '),
          grammar_main_category: normalizePOS(tags[0] || raw.grammar_main_category || raw['詞性'] || ''),
          grammar_sub_category: raw.grammar_sub_category || raw['詞性分類'] || '',
          grammar_function: raw.grammar_function || raw['語法功能'] || '',
          applicable_sentence_pattern: raw.applicable_sentence_pattern || raw['句型'] || '',
          example_sentence: raw.example_sentence || raw['例句'] || raw['ai例句'] || '',
          example_translation: raw.example_translation || raw['翻譯'] || raw['ai例句中譯'] || '',
          example_sentence_2: raw.example_sentence_2 || raw['例句2'] || raw['例句_2'] || raw.sentence2 || raw['GSAT_Example_Sentence_1'] || '',
          example_translation_2: raw.example_translation_2 || raw['翻譯2'] || raw['翻譯_2'] || raw.translation2 || raw['GSAT_Translation_1'] || '',
          example_sentence_3: raw.example_sentence_3 || raw['例句3'] || '',
          example_translation_3: raw.example_translation_3 || raw['翻譯3'] || '',
          example_sentence_4: raw.example_sentence_4 || raw['例句4'] || '',
          example_translation_4: raw.example_translation_4 || raw['翻譯4'] || '',
          example_sentence_5: raw.example_sentence_5 || raw['例句5'] || '',
          example_translation_5: raw.example_translation_5 || raw['翻譯5'] || '',
          theme: themes[0] || '',
          themes,
          level,
          cefr: raw.cefr || raw.CEFR || raw['CEFR'] || '',
          word_forms: formsRaw || '',
          word_forms_detail: normalizedDetail,
          derivatives,
          synonyms,
          antonyms,
          confusables,
          phrases: Array.isArray(raw.phrases)
            ? raw.phrases
            : typeof raw.phrases === 'string'
            ? raw.phrases.split(';').map((p: string) => p.trim()).filter((p: string) => p)
            : (raw['片語'] || '').split(';').map((p: string) => p.trim()).filter((p: string) => p),
          videoUrl: raw.videoUrl || raw.video_url || raw['影片連結'] || raw['影片'] || '',
          stage: (raw.stage === '高中' || raw.stage === 'senior') ? 'senior'
                : (raw.stage === '國中' || raw.stage === 'junior') ? 'junior'
                : null,
          textbook_index: parsedTextbookIndex,
          exam_tags: parsedExamTags,
          theme_index: parsedThemeIndex,
          affix_info: affixSource
        });

        const key = english.toLowerCase();
        const existing = byWord.get(key);

        if (existing) {
          // Merge into existing word
          incoming.posTags.forEach((tag: string) => ensureTag(existing, tag));
          const combinedThemes = mergeThemes(existing.themes, existing.theme, themes);
          existing.themes = combinedThemes;
          if (!existing.theme && combinedThemes.length) existing.theme = combinedThemes[0];
          if (level) existing.level = level;
          applyThemeOrder(existing as any, combinedThemes, counters);

          if (!existing.kk_phonetic && incoming.kk_phonetic) existing.kk_phonetic = incoming.kk_phonetic;
          if (!existing.chinese_definition && incoming.chinese_definition)
            existing.chinese_definition = incoming.chinese_definition;
          if (!existing.grammar_main_category && incoming.grammar_main_category)
            existing.grammar_main_category = incoming.grammar_main_category;
          if (!existing.grammar_sub_category && incoming.grammar_sub_category)
            existing.grammar_sub_category = incoming.grammar_sub_category;
          if (!existing.grammar_function && incoming.grammar_function)
            existing.grammar_function = incoming.grammar_function;
          if (!existing.applicable_sentence_pattern && incoming.applicable_sentence_pattern)
            existing.applicable_sentence_pattern = incoming.applicable_sentence_pattern;
          if (!existing.theme && incoming.theme) existing.theme = incoming.theme;

          const primaryPos = existing.posTags?.[0] || incoming.posTags[0] || 'noun';
          const autoSentence = exampleFor(existing.english_word, primaryPos);
          const autoTranslation = translationFor(existing.english_word, primaryPos);

          if (
            incoming.example_sentence &&
            (overrideExamples || !existing.example_sentence || existing.example_sentence === autoSentence)
          ) {
            existing.example_sentence = incoming.example_sentence;
          }
          if (
            incoming.example_translation &&
            (overrideExamples || !existing.example_translation || existing.example_translation === autoTranslation)
          ) {
            existing.example_translation = incoming.example_translation;
          }
          if (incoming.example_sentence_2 && (overrideExamples || !existing.example_sentence_2)) {
            existing.example_sentence_2 = incoming.example_sentence_2;
          }
          if (incoming.example_translation_2 && (overrideExamples || !existing.example_translation_2)) {
            existing.example_translation_2 = incoming.example_translation_2;
          }

          existing.word_forms_detail = mergeWordFormsDetail(existing.word_forms_detail, incoming.word_forms_detail);
          if (incoming.word_forms && !existing.word_forms) {
            existing.word_forms = incoming.word_forms;
          }

          existing.derivatives = dedupeList([...(existing.derivatives || []), ...incoming.derivatives]);
          existing.synonyms = dedupeList([...(existing.synonyms || []), ...incoming.synonyms]);
          existing.antonyms = dedupeList([...(existing.antonyms || []), ...incoming.antonyms]);
          existing.confusables = dedupeList([...(existing.confusables || []), ...incoming.confusables]);
          existing.phrases = dedupeList([...(existing.phrases || []), ...(incoming.phrases || [])]);
          mergeAffixInfo(existing, incoming.affix_info);

          if (incoming.videoUrl && !existing.videoUrl) {
            existing.videoUrl = incoming.videoUrl;
          }

          if (incoming.stage && !existing.stage) {
            existing.stage = incoming.stage;
          }

          if (!Array.isArray(existing.textbook_index)) {
            existing.textbook_index = [];
          }
          if (incoming.textbook_index && Array.isArray(incoming.textbook_index) && incoming.textbook_index.length > 0) {
            existing.textbook_index = dedupeList([
              ...(existing.textbook_index || []).map((item: any) => JSON.stringify(item)),
              ...incoming.textbook_index.map((item: any) => JSON.stringify(item))
            ]).map((str: string) => JSON.parse(str));
          }

          if (!Array.isArray(existing.exam_tags)) {
            existing.exam_tags = [];
          }
          if (incoming.exam_tags && Array.isArray(incoming.exam_tags) && incoming.exam_tags.length > 0) {
            existing.exam_tags = dedupeList([...(existing.exam_tags || []), ...incoming.exam_tags]);
          }

          if (!Array.isArray(existing.theme_index)) {
            existing.theme_index = [];
          }
          if (incoming.theme_index && Array.isArray(incoming.theme_index) && incoming.theme_index.length > 0) {
            existing.theme_index = dedupeList([
              ...(existing.theme_index || []).map((item: any) => JSON.stringify(item)),
              ...incoming.theme_index.map((item: any) => JSON.stringify(item))
            ]).map((str: string) => JSON.parse(str));
          }

          stats.merged += 1;
        } else {
          // Add new word
          maxId += 1;
          const newWord: any = { ...incoming, id: maxId };
          if (!newWord.theme_order) newWord.theme_order = {};
          newWord.themes = mergeThemes(newWord.themes, newWord.theme);
          applyThemeOrder(newWord, newWord.themes, counters);
          if (incoming.affix_info) newWord.affix_info = incoming.affix_info;
          next.push(newWord);
          byWord.set(key, newWord);
          stats.added += 1;
        }
      });

      themeOrderRef.current = counters;
      stats.totalAfter = next.length;
      console.log('🔄 importRows setData updater 完成');
      console.log('  - 輸入行數:', incomingList.length);
      console.log('  - 處理的行數:', processedCount);
      console.log('  - 跳過 (無資料):', skippedNoRaw);
      console.log('  - 跳過 (無英文單字):', skippedNoEnglish);
      console.log('  - 新增:', stats.added, '合併:', stats.merged);
      console.log('  - next.length (應新增到狀態):', next.length);
      return next;
    });

    console.log('✅ importRows 返回統計:', stats);
    return stats;
  };

  /**
   * Reset dataset to empty
   */
  const reset = () => {
    try {
      localStorage.removeItem(LS.dataset);
      localStorage.removeItem(LS.presetApplied);
    } catch {}
    setData(hydrateDataset([]));
  };

  /**
   * Mark preset as applied (after successful Google Sheet load)
   */
  const markPresetApplied = () => {
    try {
      localStorage.setItem(LS.presetApplied, PRESET_VERSION);
    } catch (e) {
      console.error('Failed to mark preset as applied:', e);
    }
  };

  return {
    data,
    setData,
    importRows,
    reset,
    markPresetApplied
  };
}
