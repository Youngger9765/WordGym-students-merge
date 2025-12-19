import { VersionService } from '../VersionService';

describe('VersionService', () => {
  describe('normalize', () => {
    it('should trim whitespace', () => {
      expect(VersionService.normalize('  龍騰 ')).toBe('龍騰');
    });

    it('should remove "版" suffix', () => {
      expect(VersionService.normalize('龍騰版')).toBe('龍騰');
    });

    it('should handle mixed cases', () => {
      expect(VersionService.normalize('  龍騰版 ')).toBe('龍騰');
    });
  });

  describe('getAvailableVersions', () => {
    it('should return versions for beginner stage', () => {
      const beginnerVersions = VersionService.getAvailableVersions('beginner');
      expect(beginnerVersions).toEqual(['1.0']);
    });

    it('should return versions for high stage', () => {
      const highVersions = VersionService.getAvailableVersions('high');
      expect(highVersions).toEqual(['龍騰', '三民']);
    });

    it('should return versions for junior stage', () => {
      const juniorVersions = VersionService.getAvailableVersions('junior');
      expect(juniorVersions).toEqual(['康軒', '翰林', '南一']);
    });

    it('should return empty array for invalid stage', () => {
      expect(VersionService.getAvailableVersions('invalid' as any)).toEqual([]);
    });
  });

  describe('validate', () => {
    const validationTestCases = [
      { stage: 'beginner', validVersions: ['1.0'], invalidVersions: ['2.0', '3.0'] },
      { stage: 'high', validVersions: ['龍騰', '三民'], invalidVersions: ['康軒', '翰林'] },
      { stage: 'junior', validVersions: ['康軒', '翰林', '南一'], invalidVersions: ['龍騰', '三民'] }
    ];

    validationTestCases.forEach(({ stage, validVersions, invalidVersions }) => {
      describe(`${stage} stage`, () => {
        validVersions.forEach(version => {
          it(`should validate ${version}`, () => {
            expect(VersionService.validate(version, stage)).toBe(true);
          });
        });

        invalidVersions.forEach(version => {
          it(`should reject ${version}`, () => {
            expect(VersionService.validate(version, stage)).toBe(false);
          });
        });
      });
    });
  });

  describe('validateWithErrors', () => {
    it('should provide detailed error for invalid stage', () => {
      const result = VersionService.validateWithErrors(undefined, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Stage is required');
    });

    it('should provide detailed error for invalid version', () => {
      const result = VersionService.validateWithErrors('3.0', 'beginner');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Invalid version for stage beginner');
    });

    it('should provide detailed error for version in wrong stage', () => {
      const result = VersionService.validateWithErrors('龍騰', 'beginner');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('Invalid version for stage beginner');
    });

    it('should pass for valid input', () => {
      const result = VersionService.validateWithErrors('1.0', 'beginner');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('updateAvailableVersions', () => {
    beforeEach(() => {
      // Reset versions before each test
      VersionService.updateAvailableVersions({
        high: ['龍騰', '三民'],
        junior: ['康軒', '翰林', '南一'],
        beginner: ['1.0']
      });
    });

    it('should update versions for each stage', () => {
      const newVersions = {
        high: ['新版本1', '新版本2'],
        junior: ['新版本3', '新版本4', '新版本5'],
        beginner: ['新版本6']
      };

      VersionService.updateAvailableVersions(newVersions);

      expect(VersionService.getAvailableVersions('high')).toEqual(['新版本1', '新版本2']);
      expect(VersionService.getAvailableVersions('junior')).toEqual(['新版本3', '新版本4', '新版本5']);
      expect(VersionService.getAvailableVersions('beginner')).toEqual(['新版本6']);
    });

    it('should handle partial updates', () => {
      const partialUpdate = {
        high: ['部分更新1']
      };

      VersionService.updateAvailableVersions(partialUpdate);

      expect(VersionService.getAvailableVersions('high')).toEqual(['部分更新1']);
      expect(new Set(VersionService.getAvailableVersions('junior'))).toEqual(new Set(['康軒', '翰林', '南一']));
      expect(VersionService.getAvailableVersions('beginner')).toEqual(['1.0']);
    });

    it('should ignore invalid stages', () => {
      const invalidUpdate = {
        invalidStage: ['不應該更新']
      };

      VersionService.updateAvailableVersions(invalidUpdate as any);

      expect(new Set(VersionService.getAvailableVersions('high'))).toEqual(new Set(['龍騰', '三民']));
      expect(new Set(VersionService.getAvailableVersions('junior'))).toEqual(new Set(['康軒', '翰林', '南一']));
      expect(VersionService.getAvailableVersions('beginner')).toEqual(['1.0']);
    });
  });
});