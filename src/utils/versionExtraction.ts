import { VocabularyWord } from '../types';
import { VersionService } from '../services/VersionService';

interface StageVersions {
  high: string[];
  junior: string[];
  beginner: string[];
}

export function extractAvailableVersions(data: VocabularyWord[]): Record<string, string[]> {
  const stageVersions: Record<string, string[]> = {
    high: [],
    junior: [],
    beginner: []
  };

  const extractVersion = (textbook_index?: Array<{version: string}> | string): string | null => {
    // Handle string format (e.g., "龍騰-B1-U4")
    if (typeof textbook_index === 'string' && textbook_index) {
      const parts = textbook_index.split('-');
      const version = parts[0].replace(/(高中|國中)\s*/, '').trim();
      return VersionService.normalize(version);
    }

    // Handle array format
    if (!textbook_index || !Array.isArray(textbook_index) || textbook_index.length === 0) return null;
    const firstIndex = textbook_index[0];
    if (!firstIndex || !firstIndex.version) return null;
    const normalized = firstIndex.version.replace(/(高中|國中)\s*/, '').trim();
    return VersionService.normalize(normalized);
  };

  const stageMap: Record<string, keyof StageVersions> = {
    '高中': 'high',
    'high': 'high',
    '國中': 'junior',
    'junior': 'junior',
  };

  data.forEach(word => {
    const stage = stageMap[word.stage || 'beginner'] || 'beginner';
    const version = extractVersion(word.textbook_index);

    if (version && !stageVersions[stage].includes(version)) {
      stageVersions[stage].push(version);
    }
  });

  return stageVersions;
}