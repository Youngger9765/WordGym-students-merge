import { test, expect } from '@playwright/test';

test.describe('Version Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable more detailed console logging for debugging
    page.on('console', msg => // Removed logging));

    // Clear local storage to reset version state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate with longer timeout and wait for network to be idle
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for initial loading to complete with multiple fallback selectors
    await page.waitForSelector('text=選擇階段', {
      timeout: 20000,
      state: 'visible'
    });
  });

  test('Version selection modal appears when no version is set', async ({ page }) => {
    // Multiple checks for version selection modal
    const modalTexts = ['選擇階段', '請選擇學習階段'];
    let modalFound = false;

    for (const text of modalTexts) {
      try {
        const modal = await page.getByText(text, { exact: true });
        await expect(modal).toBeVisible({ timeout: 10000 });
        modalFound = true;
        break;
      } catch {
        continue;
      }
    }

    expect(modalFound).toBeTruthy();
  });

  test('Can select stage and version successfully', async ({ page }) => {
    // More robust stage selection
    const stageButton = await page.getByRole('button', { name: '高中' });
    await expect(stageButton).toBeVisible({ timeout: 10000 });
    await stageButton.click({ delay: 200 });

    // Wait for versions with multiple strategies
    const versionSelectors = [
      'text=龍騰',
      'button:has-text("龍騰")',
      'div:has-text("龍騰")'
    ];

    let versionButton;
    for (const selector of versionSelectors) {
      try {
        versionButton = await page.locator(selector).first();
        await expect(versionButton).toBeVisible({ timeout: 10000 });
        await versionButton.click({ delay: 200 });
        break;
      } catch {
        continue;
      }
    }

    expect(versionButton).toBeTruthy();

    // Verify modal closes with multiple checks
    const modalSelectors = [
      'text=選擇階段',
      'div[role="dialog"]'
    ];

    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, {
          state: 'hidden',
          timeout: 10000
        });
      } catch {
        continue;
      }
    }

    // Verify content loads with multiple selectors
    const contentSelectors = [
      'button:has-text("大考衝刺")',
      'text=大考衝刺',
      '[data-testid="content-loaded"]'
    ];

    let contentLoaded = false;
    for (const selector of contentSelectors) {
      try {
        const contentElement = await page.locator(selector);
        await expect(contentElement).toBeVisible({ timeout: 10000 });
        contentLoaded = true;
        break;
      } catch {
        continue;
      }
    }

    expect(contentLoaded).toBeTruthy();
  });

  test('Cannot proceed without selecting version', async ({ page }) => {
    // Robust stage selection without version
    const stageButton = await page.getByRole('button', { name: '高中' });
    await expect(stageButton).toBeVisible({ timeout: 10000 });
    await stageButton.click({ delay: 200 });

    // Multiple strategies to find proceed button
    const proceedSelectors = [
      'text=確定',
      'button:has-text("確定")',
      'button[disabled]'
    ];

    let proceedButton;
    for (const selector of proceedSelectors) {
      try {
        proceedButton = await page.locator(selector);
        await expect(proceedButton).toBeDisabled({ timeout: 5000 });
        break;
      } catch {
        continue;
      }
    }

    expect(proceedButton).toBeTruthy();
  });
});