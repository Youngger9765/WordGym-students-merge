/**
 * Data Processing Utilities
 * Migrated from index.html lines 416-754
 */

import type { POSType, WordFormsDetail, AffixInfo } from '../types';

/**
 * Normalize POS tag from various formats to standard POSType
 * Migrated from index.html lines 416-427
 */
export function normalizePOS(raw: string | undefined | null): POSType {
  const s = String(raw || '').toLowerCase().trim();

  if (/^n[.\s/]*$|^noun\b|名詞/.test(s)) return 'noun';
  if (/^v[.\s/]*$|^vt\b|^vi\b|^verb\b|動詞/.test(s)) return 'verb';
  if (/^adj[.\s/]*$|^adjective\b|形容/.test(s)) return 'adjective';
  if (/^adv[.\s/]*$|^adverb\b|副詞/.test(s)) return 'adverb';
  if (/^pron[.\s/]*$|^pronoun\b|代名/.test(s)) return 'pronoun';
  if (/^prep[.\s/]*$|^preposition\b|介系/.test(s)) return 'preposition';
  if (/^conj[.\s/]*$|^conjunction\b|連接/.test(s)) return 'conjunction';

  return 'other';
}

/**
 * Split text by multiple delimiters: , ; ， 、 / \n \r
 * Migrated from index.html lines 429-438
 */
export function multiSplit(text: string | undefined | null): string[] {
  const out: string[] = [];
  let token = '';
  const str = String(text || '');
  const isDelim = (ch: string) => /[,;，、/\n\r]/.test(ch);

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (isDelim(ch)) {
      if (token) out.push(token);
      token = '';
    } else {
      token += ch;
    }
  }
  if (token) out.push(token);

  return out.map(s => s.trim()).filter(Boolean);
}

/**
 * Create empty WordFormsDetail object
 * Migrated from index.html line 440
 */
export function emptyWordFormsDetail(): WordFormsDetail {
  return { base: [], idiom: [], compound: [], derivation: [] };
}

/**
 * Deduplicate and clean array of strings
 * Migrated from index.html line 442
 */
export function dedupeList(arr: string[] = []): string[] {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)));
}

/**
 * Merge multiple theme values into single deduplicated array
 * Handles strings, arrays, and mixed formats with multi-delimiter support
 * Migrated from index.html lines 444-462
 */
export function mergeThemes(...values: any[]): string[] {
  const result = new Set<string>();

  const ingest = (val: any, allowSplit = true): void => {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      val.forEach(item => ingest(item, true));
      return;
    }
    const str = String(val).trim();
    if (!str) return;

    if (allowSplit) {
      const tokens = multiSplit(str);
      if (tokens.length > 1) {
        tokens.forEach(token => ingest(token, false));
        return;
      }
    }
    result.add(str);
  };

  values.forEach(val => ingest(val, true));
  return Array.from(result);
}

/**
 * Get themes from a word object (combines themes and theme fields)
 * Migrated from index.html line 464
 */
export function getWordThemes(word: { themes?: string[]; theme?: string }): string[] {
  return mergeThemes(word?.themes, word?.theme);
}

/**
 * Check if word has specific theme
 * Migrated from index.html lines 465-468
 */
export function wordHasTheme(word: { themes?: string[]; theme?: string }, themeKey: string): boolean {
  if (!themeKey) return false;
  return getWordThemes(word).includes(themeKey);
}

/**
 * Categorize word forms into base/idiom/compound/derivation
 * Migrated from index.html lines 680-700
 */
export function categorizeWordForms(forms: string[], baseWord: string): WordFormsDetail {
  const detail = emptyWordFormsDetail();
  const lower = baseWord.toLowerCase();

  forms.forEach(form => {
    const f = form.trim();
    if (!f) return;
    const fLower = f.toLowerCase();

    // Check if it's the base form or simple variation
    if (fLower === lower || fLower === lower + 's' || fLower === lower + 'es' ||
        fLower === lower + 'ed' || fLower === lower + 'ing') {
      detail.base.push(f);
    }
    // Check for idioms (contains spaces)
    else if (f.includes(' ')) {
      detail.idiom?.push(f);
    }
    // Check for compounds (hyphenated or contains base word)
    else if (f.includes('-') || fLower.includes(lower)) {
      detail.compound?.push(f);
    }
    // Everything else is derivation
    else {
      detail.derivation?.push(f);
    }
  });

  detail.base = dedupeList(detail.base);
  detail.idiom = dedupeList(detail.idiom || []) || [];
  detail.compound = dedupeList(detail.compound || []) || [];
  detail.derivation = dedupeList(detail.derivation || []) || [];

  return detail;
}

/**
 * Normalize word forms detail from various input formats
 * Migrated from index.html lines 702-720
 */
export function normalizeWordFormsDetail(
  rawDetail: any,
  fallback: string[] | string = [],
  baseWord = ''
): WordFormsDetail {
  let detail = emptyWordFormsDetail();

  if (rawDetail && typeof rawDetail === 'object' && !Array.isArray(rawDetail)) {
    detail.base = dedupeList(rawDetail.base || rawDetail.root || []);
    detail.idiom = dedupeList(rawDetail.idiom || rawDetail.phrase || []);
    detail.compound = dedupeList(rawDetail.compound || rawDetail.compounds || []);
    detail.derivation = dedupeList(
      rawDetail.derivation || rawDetail.other || rawDetail.misc || []
    );
  }

  const remaining: string[] = [];
  if (Array.isArray(rawDetail)) remaining.push(...rawDetail);
  if (Array.isArray(fallback)) remaining.push(...fallback);
  if (typeof fallback === 'string') remaining.push(...multiSplit(fallback));

  const categorized = categorizeWordForms(remaining, baseWord);
  if (!detail.base.length) detail.base = categorized.base;
  if (!detail.idiom?.length) detail.idiom = categorized.idiom || [];
  if (!detail.compound?.length) detail.compound = categorized.compound || [];
  if (!detail.derivation?.length) detail.derivation = categorized.derivation || [];

  return detail;
}

/**
 * Merge two WordFormsDetail objects
 * Migrated from index.html lines 741-754
 */
export function mergeWordFormsDetail(
  target: WordFormsDetail | null | undefined,
  source: WordFormsDetail | null | undefined
): WordFormsDetail {
  const base = target
    ? {
        base: dedupeList(target.base || []),
        idiom: dedupeList(target.idiom || []),
        compound: dedupeList(target.compound || []),
        derivation: dedupeList(target.derivation || [])
      }
    : emptyWordFormsDetail();

  if (!source) return base;

  base.base = dedupeList([...base.base, ...(source.base || [])]);
  base.idiom = dedupeList([...(base.idiom || []), ...(source.idiom || [])]) || [];
  base.compound = dedupeList([...(base.compound || []), ...(source.compound || [])]) || [];
  base.derivation = dedupeList([
    ...(base.derivation || []),
    ...(source.derivation || (source as any).other || [])
  ]) || [];

  return base;
}

/**
 * Merge affix info from source into target
 */
export function mergeAffixInfo(
  target: { affix_info?: string | AffixInfo },
  source: AffixInfo | undefined
): void {
  if (!source) return;
  if (!target.affix_info || typeof target.affix_info === 'string') {
    target.affix_info = { prefix: '', root: '', suffix: '', meaning: '', example: '' };
  }

  if (source.prefix && !target.affix_info.prefix) target.affix_info.prefix = source.prefix;
  if (source.root && !target.affix_info.root) target.affix_info.root = source.root;
  if (source.suffix && !target.affix_info.suffix) target.affix_info.suffix = source.suffix;
  if (source.meaning && !target.affix_info.meaning) target.affix_info.meaning = source.meaning;
  if (source.example && !target.affix_info.example) target.affix_info.example = source.example;
}

/**
 * Convert array to list format for display
 */
export function toList(value: any, alt: string = ''): string[] {
  return Array.isArray(value) ? value : multiSplit(value || alt || '');
}
