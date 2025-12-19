/**
 * TSV (Tab-Separated Values) Parser
 * Migrated from index.html lines 133-180
 *
 * 解析 TSV 格式，比 CSV 更簡單可靠
 * 跳過前面的空行，找到包含 "english_word" 或 "word" 的行作為標題行
 */

export function parseTSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // 找到標題行：包含 "english_word" 或 "word"（不區分大小寫）
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // 跳過空行

    const headers = line.split('\t').map(h => String(h || '').replace(/^\uFEFF/, '').trim().toLowerCase());
    // 檢查是否包含 english_word 或 word 欄位
    if (headers.includes('english_word') || headers.includes('word') || headers.includes('英文') || headers.includes('英文單字')) {
      headerRowIndex = i;
      break;
    }
  }

  // 如果找不到標題行，使用第一行作為標題（向後相容）
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    console.warn('警告：找不到包含 english_word 或 word 的標題行，使用第一行作為標題');
  }

  const headers = lines[headerRowIndex].split('\t').map(h => String(h || '').replace(/^\uFEFF/, '').trim());
  const rows: Record<string, string>[] = [];

  // 從標題行的下一行開始解析資料
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // 跳過空行

    const values = line.split('\t');
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key) {
        obj[key] = (values[j] || '').trim();
      }
    }
    rows.push(obj);
  }

  // Removed logging;
  return rows;
}
