/**
 * Google Sheet Loader Service
 * Migrated from index.html lines 186-230
 *
 * Loads vocabulary data from Google Sheets using TSV export format
 *
 * CORS/file:// Protocol Solution:
 * ================================
 * Problem: Browsers block fetch() from file:// protocol (security restriction)
 * Google Sheets TSV export has CORS headers (Access-Control-Allow-Origin: *)
 * but this doesn't help with file:// protocol.
 *
 * Solution:
 * - When running from file:// → Use JSONP via CORS proxy (allorigins.win)
 * - When running from http(s):// → Use direct fetch (faster, no proxy)
 *
 * This allows the single-file build (dist/index.html) to work when:
 * 1. Double-clicked (file://) - slower first load, uses proxy
 * 2. Served via HTTP server - normal speed, direct access
 *
 * Alternative approaches considered:
 * - Chrome --allow-file-access-from-files flag (requires user to modify browser)
 * - Embed data in HTML (loses dynamic update capability)
 * - Force HTTP server only (reduces portability)
 */

import { parseTSV } from '../utils/tsvParser';
import { GOOGLE_SHEET_CONFIG, SheetConfig } from '../config/googleSheet';

export interface SheetLoadResult {
  rows: Record<string, string>[];
  theme: string;
}

/**
 * Detect if running from file:// protocol
 */
function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

/**
 * CORS Proxy Configuration
 * Multiple proxies to try in sequence for reliability
 */
const CORS_PROXIES = [
  {
    name: 'corsproxy.io',
    getUrl: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    supportsJsonp: false,
    timeout: 60000, // 60 seconds
  },
  {
    name: 'allorigins.win',
    getUrl: (targetUrl: string, callback?: string) =>
      callback
        ? `https://api.allorigins.win/get?callback=${callback}&url=${encodeURIComponent(targetUrl)}`
        : `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
    supportsJsonp: true,
    timeout: 60000,
    parseResponse: (response: any) => response?.contents,
  },
  {
    name: 'cors-anywhere (demo)',
    getUrl: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
    supportsJsonp: false,
    timeout: 60000,
  },
];

/**
 * Load data using script tag injection (JSONP - works from file:// protocol)
 */
function loadViaScriptTag(url: string, proxyConfig: typeof CORS_PROXIES[0]): Promise<string> {
  return new Promise((resolve, reject) => {
    const callbackName = `gsheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const script = document.createElement('script');
    let timeoutId: number;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    // Set up callback
    (window as any)[callbackName] = (response: any) => {
      cleanup();
      try {
        const data = proxyConfig.parseResponse ? proxyConfig.parseResponse(response) : response;
        if (data) {
          resolve(data);
        } else {
          reject(new Error(`Invalid response from ${proxyConfig.name}`));
        }
      } catch (error) {
        reject(new Error(`Failed to parse response from ${proxyConfig.name}: ${error}`));
      }
    };

    // Set up error handling
    script.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load script from ${proxyConfig.name}`));
    };

    // Set timeout
    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Request timeout (${proxyConfig.timeout}ms) for ${proxyConfig.name}`));
    }, proxyConfig.timeout);

    // Build proxy URL with JSONP callback
    const proxyUrl = proxyConfig.getUrl(url, callbackName);
    console.log(`嘗試使用 JSONP 代理: ${proxyConfig.name}`);
    script.src = proxyUrl;
    document.head.appendChild(script);
  });
}

/**
 * Load data via fetch with CORS proxy (for non-JSONP proxies)
 */
async function loadViaFetchProxy(url: string, proxyConfig: typeof CORS_PROXIES[0]): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), proxyConfig.timeout);

  try {
    const proxyUrl = proxyConfig.getUrl(url);
    console.log(`嘗試使用 Fetch 代理: ${proxyConfig.name}`);

    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${proxyConfig.name}`);
    }

    if (proxyConfig.parseResponse) {
      const json = await response.json();
      const data = proxyConfig.parseResponse(json);
      if (!data) throw new Error(`Invalid response format from ${proxyConfig.name}`);
      return data;
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout (${proxyConfig.timeout}ms) for ${proxyConfig.name}`);
    }
    throw error;
  }
}

/**
 * Try loading with multiple CORS proxies in sequence
 */
async function loadWithProxyFallback(url: string, useJsonp: boolean): Promise<string> {
  const errors: Array<{ proxy: string; error: string }> = [];

  for (const proxyConfig of CORS_PROXIES) {
    try {
      // Skip proxies that don't support required method
      if (useJsonp && !proxyConfig.supportsJsonp) continue;

      const data = useJsonp
        ? await loadViaScriptTag(url, proxyConfig)
        : await loadViaFetchProxy(url, proxyConfig);

      console.log(`✓ 成功使用代理: ${proxyConfig.name}`);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`✗ ${proxyConfig.name} 失敗:`, errorMsg);
      errors.push({ proxy: proxyConfig.name, error: errorMsg });
    }
  }

  // All proxies failed
  const errorDetails = errors.map(e => `  - ${e.proxy}: ${e.error}`).join('\n');
  throw new Error(`所有 CORS 代理都失敗:\n${errorDetails}`);
}

/**
 * Load data from a single Google Sheet
 */
export async function loadFromGoogleSheet(sheetConfig: SheetConfig): Promise<SheetLoadResult> {
  try {
    // 改用 TSV 格式，避免 CSV 的引號和逗號解析問題
    const tsvUrl = `https://docs.google.com/spreadsheets/d/${sheetConfig.sheetId}/export?format=tsv&gid=${sheetConfig.gid}`;
    console.log(`載入 Google Sheet (TSV): ${sheetConfig.name}`, tsvUrl);

    let tsvText: string;

    // For file:// protocol, use script tag injection since fetch() doesn't work
    if (isFileProtocol()) {
      console.log('偵測到 file:// 協定，使用 JSONP 方式載入（透過 CORS 代理）');
      tsvText = await loadWithProxyFallback(tsvUrl, true);
    } else {
      // For http(s)://, try direct fetch first, fallback to proxy if CORS fails
      try {
        console.log('嘗試直接載入（無代理）');
        const response = await fetch(tsvUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        tsvText = await response.text();
        console.log('✓ 直接載入成功');
      } catch (directError) {
        console.warn('直接載入失敗，嘗試使用 CORS 代理:', directError);
        tsvText = await loadWithProxyFallback(tsvUrl, false);
      }
    }

    console.log(`TSV 原始資料長度: ${tsvText.length} 字符`);

    const rows = parseTSV(tsvText);
    console.log(`解析後得到 ${rows.length} 筆資料`);

    return { rows, theme: sheetConfig.theme };
  } catch (error) {
    console.error(`載入失敗: ${sheetConfig.name}`, error);
    throw error;
  }
}

/**
 * Load data from all configured Google Sheets
 */
export async function loadAllGoogleSheets(): Promise<SheetLoadResult[]> {
  if (!GOOGLE_SHEET_CONFIG.enabled) {
    console.log('Google Sheet 載入已停用');
    return [];
  }

  const results: SheetLoadResult[] = [];
  for (const sheetConfig of GOOGLE_SHEET_CONFIG.sheets) {
    try {
      const result = await loadFromGoogleSheet(sheetConfig);
      results.push(result);
    } catch (error) {
      console.warn(`跳過: ${sheetConfig.name}`);
    }
  }

  return results;
}
