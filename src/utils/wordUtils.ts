/**
 * Word-specific Utility Functions
 * Migrated from index.html lines 256-413
 */

import type { POSType, VocabularyWord } from '../types';
import { POS_LABEL } from '../types';

/**
 * Generate example sentence for a word based on POS
 * Migrated from index.html lines 256-269
 */
export function exampleFor(word: string, pos: POSType): string {
  const w = String(word || '').trim();
  if (!w) return '';
  const lower = w.toLowerCase();
  const article = /^[aeiou]/i.test(w) ? 'an' : 'a';

  switch (pos) {
    case 'noun':
      return `This is ${article} ${lower}.`;
    case 'verb':
      return `I ${lower} every day.`;
    case 'adjective':
      return `It is very ${lower}.`;
    case 'adverb':
      return `She speaks ${lower}.`;
    default:
      return `Example with ${w}.`;
  }
}

/**
 * Generate translation for a word based on POS
 * Migrated from index.html lines 271-313
 */
export function translationFor(word: string, pos: POSType): string {
  const w = String(word || '').trim();
  if (!w) return '';
  const lower = w.toLowerCase();

  const translations: Record<string, string> = {
    abandon: '放棄',
    ability: '能力',
    able: '能夠的',
    about: '關於',
    above: '在...之上',
    abroad: '在國外',
    absence: '缺席',
    absent: '缺席的',
    absolute: '絕對的',
    absolutely: '絕對地',
    absorb: '吸收',
    abstract: '抽象的',
    academic: '學術的',
    accept: '接受',
    access: '接近',
    accident: '意外',
    accompany: '陪伴',
    accomplish: '完成',
    according: '根據',
    account: '帳戶'
  };

  const zh = translations[lower] || '（中譯）';
  const isZh = /[\u4e00-\u9fff]/.test(zh);
  if (isZh) return zh;

  return pos === 'noun' ? '這是（中譯）' : '（中譯）';
}

/**
 * Get POS label from array of tags
 * Migrated from index.html lines 315-320
 */
export function posLabelFromArray(tags: string[] = []): string {
  return tags
    .map(tag => POS_LABEL[tag as POSType] || tag)
    .join('、');
}

/**
 * Get theme display labels from word
 * Helper function for markdown generation
 */
export function getThemeDisplayLabels(word: VocabularyWord): string[] {
  const themes: string[] = [];
  if (word.themes && word.themes.length > 0) {
    themes.push(...word.themes);
  } else if (word.theme) {
    themes.push(word.theme);
  }
  return themes;
}

/**
 * Convert word to Markdown format for export
 * Migrated from index.html lines 322-413
 */
export function wordToMarkdown(
  word: VocabularyWord,
  selPos: POSType | null = null,
  extras: Partial<VocabularyWord> = {},
  sections: Record<string, boolean> = { pos: true, relations: true, affix: true }
): string {
  const lines: string[] = [];

  // Title
  const heading = (extras.english_word ?? word.english_word ?? '').trim();
  if (heading) {
    lines.push(`# ${heading}`);
  }

  // KK Phonetic
  const kk = (extras.kk_phonetic ?? word.kk_phonetic ?? '').trim();
  if (kk) {
    lines.push(`**KK音標**: ${kk}`);
  }

  // POS Tags
  const posText = posLabelFromArray(word.posTags || []);
  if (posText) {
    lines.push(`**詞性**: ${posText}`);
  }

  // Level
  const levelText = String(extras.level ?? word.level ?? '').trim();
  if (levelText) {
    lines.push(`**程度**: ${levelText}`);
  }

  // Theme Labels
  const themeLabels = getThemeDisplayLabels(word);
  if (themeLabels.length > 0) {
    lines.push(`**主題**: ${themeLabels.join('、')}`);
  }

  // Chinese Definition
  const chineseDef = (extras.chinese_definition ?? word.chinese_definition ?? '').trim();
  if (chineseDef) {
    lines.push('', '## 釋義', chineseDef);
  }

  // Examples
  const exampleSentence = (extras.example_sentence ?? word.example_sentence ?? '').trim();
  const exampleTranslation = (extras.example_translation ?? word.example_translation ?? '').trim();
  const exampleSentence2 = (extras.example_sentence_2 ?? word.example_sentence_2 ?? '').trim();
  const exampleTranslation2 = (extras.example_translation_2 ?? word.example_translation_2 ?? '').trim();

  if (exampleSentence || exampleSentence2) {
    lines.push('', '## 例句');
    if (exampleSentence) {
      lines.push(`- **${exampleSentence}**`);
      if (exampleTranslation) lines.push(`  - ${exampleTranslation}`);
    }
    if (exampleSentence2) {
      lines.push(`- **${exampleSentence2}**`);
      if (exampleTranslation2) lines.push(`  - ${exampleTranslation2}`);
    }
  }

  // Grammar/POS Section
  if (sections.pos) {
    const grammarLines: string[] = [];
    const primaryPos = selPos || word.grammar_main_category || (word.posTags || [])[0];
    if (primaryPos) grammarLines.push(`- 主要詞性：${POS_LABEL[primaryPos as POSType] || primaryPos}`);

    const subCat = (extras.grammar_sub_category ?? word.grammar_sub_category ?? '').trim();
    if (subCat) grammarLines.push(`- 分類：${subCat}`);

    const gFunc = (extras.grammar_function ?? word.grammar_function ?? '').trim();
    if (gFunc) grammarLines.push(`- 功能：${gFunc}`);

    const gPattern = (extras.applicable_sentence_pattern ?? word.applicable_sentence_pattern ?? '').trim();
    if (gPattern) grammarLines.push(`- 適用句型：${gPattern}`);

    const formsSource = extras.word_forms ?? word.word_forms ?? '';
    const formsList = Array.isArray(formsSource) ? formsSource : (formsSource as string).split(/[,;，、]/).map(s => s.trim()).filter(Boolean);
    const cleanedForms = formsList.filter(Boolean);
    if (cleanedForms.length) grammarLines.push(`- 詞性變化：${cleanedForms.join('、')}`);

    if (grammarLines.length) {
      lines.push('', '### 詞性', ...grammarLines);
    }
  }

  // Relations Section
  if (sections.relations) {
    const relationLines: string[] = [];
    const synonyms = extras.synonyms ?? word.synonyms ?? [];
    const synList = Array.isArray(synonyms) ? synonyms : (synonyms as any).split(/[,;，、]/).map((s: string) => s.trim()).filter(Boolean);
    if (synList.length) relationLines.push(`- 同義字：${synList.join('、')}`);

    const antonyms = extras.antonyms ?? word.antonyms ?? [];
    const antList = Array.isArray(antonyms) ? antonyms : (antonyms as any).split(/[,;，、]/).map((s: string) => s.trim()).filter(Boolean);
    if (antList.length) relationLines.push(`- 反義字：${antList.join('、')}`);

    const confusables = extras.confusables ?? word.confusables ?? [];
    const confList = Array.isArray(confusables) ? confusables : (confusables as any).split(/[,;，、]/).map((s: string) => s.trim()).filter(Boolean);
    if (confList.length) relationLines.push(`- 易混淆字：${confList.join('、')}`);

    if (relationLines.length) {
      lines.push('', '### 同義／反義／易混淆', ...relationLines);
    }
  }

  // Affix Section
  if (sections.affix) {
    const affix = extras.affix_info ?? word.affix_info ?? {} as any;
    const affixLines: string[] = [];
    const prefix = String((affix as any).prefix || '').trim();
    const root = String((affix as any).root || '').trim();
    const suffix = String((affix as any).suffix || '').trim();
    const meaning = String((affix as any).meaning || '').trim();
    const example = String((affix as any).example || '').trim();

    if (prefix) affixLines.push(`- 字首：${prefix}`);
    if (root) affixLines.push(`- 字根：${root}`);
    if (suffix) affixLines.push(`- 字尾：${suffix}`);
    if (meaning) affixLines.push(`- 字源意涵：${meaning}`);
    if (example) affixLines.push(`- 延伸例子：${example}`);

    if (affixLines.length) {
      lines.push('', '### 字源分析', ...affixLines);
    }
  }

  return lines.join('\n');
}
