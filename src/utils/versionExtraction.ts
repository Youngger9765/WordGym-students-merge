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

  const extractVersion = (textbook_index?: Array<{version: string}>): string | null => {
    if (!textbook_index || textbook_index.length === 0) return null;
    const normalized = textbook_index[0].version.replace(/(高中|國中)\s*/, '').trim();
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