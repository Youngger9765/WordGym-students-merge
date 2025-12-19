export class VersionService {
  private static stageMapping: Record<string, string> = {
    '高中': 'high',
    '國中': 'junior',
    '國小': 'beginner',
    'senior': 'high',
    'junior': 'junior',
    'beginner': 'beginner'
  };

  private static stages: string[] = ['high', 'junior', 'beginner'];

  private static versions: Record<string, string[]> = {
    high: ['龍騰', '三民'],
    junior: ['康軒', '翰林', '南一'],
    beginner: ['1.0']
  };

  static normalizeStage(stage: string): string {
    // Converts UI stage, settings stage, or version service stage to version service stage
    return this.stageMapping[stage] || stage;
  }

  static updateAvailableVersions(versions: Record<string, string[]>): void {
    // Validate the input matches our schema
    this.stages.forEach(stage => {
      if (stage in versions && Array.isArray(versions[stage])) {
        const stageVersions = versions[stage as keyof typeof versions];
        this.versions[stage] = Array.from(new Set(stageVersions)).sort();
      }
    });
  }

  static validateWithErrors(version: string | undefined, stage: string | undefined): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];

    // Stage validation first
    if (!stage) {
      errors.push('Stage is required');
      return { isValid: false, errors };
    }

    const normalizedStage = this.normalizeStage(stage);

    if (!this.stages.includes(normalizedStage)) {
      errors.push(`Invalid stage: ${stage}`);
      return { isValid: false, errors };
    }

    // Version validation
    if (!version) {
      errors.push('Version is required');
      return { isValid: false, errors };
    }

    if (!this.versions[normalizedStage]?.includes(version)) {
      errors.push(`Invalid version for stage ${stage}`);
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  static normalize(version: string): string {
    return version.trim().replace('版', '');
  }

  static getAvailableVersions(stage?: string): string[] {
    return stage && this.versions[stage] ? this.versions[stage] : [];
  }

  static validate(version: string | undefined, stage: string | undefined): boolean {
    if (!version || !stage) return false;
    return this.versions[stage]?.includes(version) || false;
  }

  static normalizeWithGuard(version: string | undefined, fallback: string = ''): string {
    return version ? this.normalize(version) : fallback;
  }

  static isValidSelection(version: string | undefined, stage: string | undefined): boolean {
    if (!version || !stage) return false;
    return this.validate(version, stage);
  }
}