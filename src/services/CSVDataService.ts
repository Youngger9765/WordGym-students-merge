/**
 * CSVDataService - Fetches vocabulary data from Google Sheets CSV
 * Issue #72: Direct CSV loading instead of static JSON
 */

import { VocabularyWord } from "../types";
import { IndexedDBCache } from "./IndexedDBCache";

// Google Sheet published as CSV (read-only)
// Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1RRR2HkwdwxabYVx5Y1Fuec1DKdi4xoSBLSaNVEAwUAQ/export?format=csv&gid=0";

// Cache expiry: 24 hours (in milliseconds)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface CSVDataResult {
  data: VocabularyWord[];
  fromCache: boolean;
  cacheAge?: number; // milliseconds since cache was created
}

/**
 * Parse CSV text into rows
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if (
      (char === "\n" || (char === "\r" && nextChar === "\n")) &&
      !insideQuotes
    ) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      if (char === "\r") i++; // Skip \n after \r
    } else if (char !== "\r") {
      currentCell += char;
    }
  }

  // Handle last row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse textbook_index string to array of objects
 * Format: "龍騰-B1-U4" or "龍騰-B1-U4; 翰林-B2-L3" (semicolon separated)
 */
function parseTextbookIndex(
  raw: string,
): { version: string; vol: string; lesson: string }[] {
  if (!raw || typeof raw !== "string") return [];

  const items = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const result: { version: string; vol: string; lesson: string }[] = [];

  items.forEach((item) => {
    const parts = item.split("-").map((s) => s.trim());
    if (parts.length >= 3) {
      result.push({
        version: parts[0],
        vol: parts[1],
        lesson: parts[2],
      });
    }
  });

  return result;
}

/**
 * Parse exam_tags string to array
 * Format: "106學測" or "106學測; 107學測" (semicolon separated)
 */
function parseExamTags(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse theme_index for junior stage
 * Format: "1200-family | 800-family" (pipe or semicolon separated)
 */
function parseThemeIndex(raw: string): { range: string; theme: string }[] {
  if (!raw || typeof raw !== "string") return [];

  const items = raw
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const result: { range: string; theme: string }[] = [];

  items.forEach((item) => {
    const parts = item.split("-").map((s) => s.trim());
    if (parts.length >= 2) {
      const range = parts[0];
      const theme = parts.slice(1).join("-");
      if (/^\d+$/.test(range) && theme) {
        result.push({ range, theme });
      }
    }
  });

  return result;
}

/**
 * Convert CSV row to VocabularyWord object
 */
function rowToWord(
  headers: string[],
  row: string[],
  index: number,
): VocabularyWord | null {
  const obj: Record<string, string> = {};
  headers.forEach((header, i) => {
    obj[header] = row[i] || "";
  });

  const englishWord = (
    obj["english_word"] ||
    obj["Word"] ||
    obj["英文"] ||
    obj["英文單字"] ||
    ""
  ).trim();
  if (!englishWord) return null;

  // Normalize stage
  const rawStage = obj["stage"] || "";
  let stage: string | undefined = undefined;
  if (rawStage === "高中" || rawStage === "senior") stage = "senior";
  else if (rawStage === "國中" || rawStage === "junior") stage = "junior";

  // Parse POS tags
  const posRaw =
    obj["posTags"] || obj["basic_pos"] || obj["pos"] || obj["詞性"] || "";
  const posTags = posRaw
    .split(/[,;，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (posTags.length === 0) posTags.push("other");

  return {
    id: index,
    english_word: englishWord,
    english: englishWord,
    kk_phonetic: obj["kk_phonetic"] || obj["KK"] || obj["KK音標"] || "",
    chinese_definition:
      obj["chinese_definition"] || obj["中譯"] || obj["中文"] || "",
    // pos is optional, using posTags instead
    posTags,
    basic_pos: posTags.join(", "),
    grammar_main_category: posTags[0] || "",
    grammar_sub_category: obj["grammar_sub_category"] || "",
    grammar_function: obj["grammar_function"] || "",
    applicable_sentence_pattern: obj["applicable_sentence_pattern"] || "",
    example_sentence:
      obj["example_sentence"] || obj["例句"] || obj["ai例句"] || "",
    example_translation:
      obj["example_translation"] || obj["翻譯"] || obj["ai例句中譯"] || "",
    example_sentence_2:
      obj["example_sentence_2"] ||
      obj["例句2"] ||
      obj["GSAT_Example_Sentence_1"] ||
      "",
    example_translation_2:
      obj["example_translation_2"] ||
      obj["翻譯2"] ||
      obj["GSAT_Translation_1"] ||
      "",
    example_sentence_3: obj["example_sentence_3"] || "",
    example_translation_3: obj["example_translation_3"] || "",
    example_sentence_4: obj["example_sentence_4"] || "",
    example_translation_4: obj["example_translation_4"] || "",
    example_sentence_5: obj["example_sentence_5"] || "",
    example_translation_5: obj["example_translation_5"] || "",
    year_1: obj["Year_1"] || obj["year_1"] || "",
    part_1: obj["Part_1"] || obj["part_1"] || "",
    source_1: obj["Source_1"] || obj["source_1"] || "",
    theme: obj["theme"] || "",
    themes: obj["themes"]
      ? obj["themes"]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    level: obj["level"] || obj["Level"] || "",
    cefr: obj["cefr"] || obj["CEFR"] || "",
    word_forms: obj["word_forms"] || "",
    word_forms_detail: [],
    synonyms: obj["synonyms"]
      ? obj["synonyms"]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    antonyms: obj["antonyms"]
      ? obj["antonyms"]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    confusables: obj["confusables"]
      ? obj["confusables"]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    phrases: obj["phrases"]
      ? obj["phrases"]
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    videoUrl: obj["videoUrl"] || obj["video_url"] || obj["影片連結"] || "",
    stage,
    textbook_index: parseTextbookIndex(
      obj["textbook_index"] || obj["課本索引"] || "",
    ),
    exam_tags: parseExamTags(obj["exam_tags"] || obj["歷屆試題"] || ""),
    theme_index:
      stage === "junior"
        ? parseThemeIndex(obj["主題"] || obj["theme_index"] || "")
        : [],
    affix_info: {},
  };
}

/**
 * Fetch and parse CSV data from Google Sheets
 */
async function fetchCSVData(): Promise<VocabularyWord[]> {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch CSV: ${response.status} ${response.statusText}`,
    );
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const headers = rows[0];
  const words: VocabularyWord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const word = rowToWord(headers, rows[i], i);
    if (word) {
      words.push(word);
    }
  }

  return words;
}

/**
 * CSVDataService - Main class for data loading with caching
 */
export class CSVDataService {
  private cache: IndexedDBCache;

  constructor() {
    this.cache = new IndexedDBCache("wordgym-vocabulary", "vocabulary-store");
  }

  /**
   * Load vocabulary data with caching
   * Returns cached data if fresh, otherwise fetches from Google Sheets
   */
  async loadData(forceRefresh = false): Promise<CSVDataResult> {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await this.cache.get<{
        data: VocabularyWord[];
        timestamp: number;
      }>("vocabulary");
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRY_MS) {
          return {
            data: cached.data,
            fromCache: true,
            cacheAge: age,
          };
        }
      }
    }

    // Fetch fresh data
    const data = await fetchCSVData();

    // Cache the data
    await this.cache.set("vocabulary", {
      data,
      timestamp: Date.now(),
    });

    return {
      data,
      fromCache: false,
    };
  }

  /**
   * Get cache info (for debugging/display)
   */
  async getCacheInfo(): Promise<{
    exists: boolean;
    age?: number;
    expiresIn?: number;
  }> {
    const cached = await this.cache.get<{
      data: VocabularyWord[];
      timestamp: number;
    }>("vocabulary");
    if (!cached) {
      return { exists: false };
    }

    const age = Date.now() - cached.timestamp;
    return {
      exists: true,
      age,
      expiresIn: Math.max(0, CACHE_EXPIRY_MS - age),
    };
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    await this.cache.delete("vocabulary");
  }
}

// Singleton instance
export const csvDataService = new CSVDataService();
