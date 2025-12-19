import { test, expect } from '@playwright/test';

test.describe('Version Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);

    // Simulating production-like loading and storage
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes('google') || url.includes('sheets')) {
        route.continue();
      } else {
        route.continue();
      }
    });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    const loadingSelectors = [
      '[data-testid="welcome-modal"]',
      'text=歡迎來到 WordGym',
      'text=選擇階段'
    ];

    let loaded = false;
    for (const selector of loadingSelectors) {
      try {
        await page.waitForSelector(selector, {
          timeout: 30000,
          state: 'visible'
        });
        loaded = true;
        break;
      } catch {
        continue;
      }
    }

    expect(loaded, 'Welcome modal should load').toBeTruthy();
  });

  test('Version selection and localStorage persistence', async ({ page }) => {
    test.setTimeout(60000);

    const stages = [
      {
        uiName: '高中',
        settingsName: 'senior',
        versionServiceName: 'high',
        versions: ['龍騰', '三民']
      },
      {
        uiName: '國中',
        settingsName: 'junior',
        versionServiceName: 'junior',
        versions: ['康軒', '翰林', '南一']
      }
    ];

    for (const stage of stages) {
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Select stage
      const stageButton = await page.getByText(stage.uiName);
      await stageButton.waitFor({ state: 'visible', timeout: 10000 });
      await stageButton.click();

      // Validate version list
      const versionOptions = await page.$$eval('select option', options =>
        options.map(option => option.textContent)
      );

      console.log(`Stage: ${stage.uiName}, Versions:`, versionOptions);

      // Check version availability
      for (const version of stage.versions) {
        expect(versionOptions).toContain(version);
      }

      // Select a version
      await page.selectOption('select', stage.versions[0]);

      // Confirm
      const confirmButton = await page.getByText('確認');
      await confirmButton.click();

      // Wait for stabilization
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');

      // Verify localStorage
      const settings = await page.evaluate(() =>
        localStorage.getItem('wordgym_user_settings_v1')
      );

      console.log(`Settings for ${stage.uiName}:`, settings);

      // Add mapping to convert UI stage to settings and version service stages
      const parsedSettings = settings ? JSON.parse(settings) : null;
      expect(parsedSettings).not.toBeNull();
      expect(parsedSettings.stage).toBe(stage.settingsName);
      expect(parsedSettings.version).toBe(stage.versions[0]);
    }
  });
});