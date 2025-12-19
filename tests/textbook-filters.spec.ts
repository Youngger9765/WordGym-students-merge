import { test, expect } from '@playwright/test';

test('Textbook Filters Display Correctly', async ({ page }) => {
  // Navigate to the application with longer timeout
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });

  // Wait for potential React hydration and version selector
  await page.waitForTimeout(3000);

  // Verify version selector exists and has options
  const versionOptions = await page.evaluate(() => {
    const select = document.querySelector('select[name="version"]') as HTMLSelectElement | null;
    if (!select) return [];
    return Array.from(select.options).map(option => option.text);
  });

  // Removed logging;
  expect(versionOptions.length).toBeGreaterThan(1);

  // Select the first non-placeholder version
  const validVersionIndex = versionOptions.findIndex(text =>
    text !== '請選擇版本' && text.trim() !== ''
  );

  // If a valid version is found, select it and wait
  if (validVersionIndex !== -1) {
    await page.evaluate((index) => {
      const select = document.querySelector('select[name="version"]') as HTMLSelectElement;
      if (select) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, validVersionIndex);

    // Wait for potential updates
    await page.waitForTimeout(3000);
  }

  // Check if content is loaded and error is not present
  const contentVerification = await page.evaluate(() => {
    // Check for error message
    const errorMessage = Array.from(document.querySelectorAll('*'))
      .find(el => el.textContent?.includes('課本進度資料尚未建立'));

    // Look for various content indicators
    const contentSelectors = [
      '[data-testid="textbook-content"]',
      '.textbook-content',
      '[data-testid="word-list"]',
      '.word-list',
      'div[data-testid]',
      'div[class*="content"]'
    ];

    const contentElements = contentSelectors
      .map(selector => document.querySelector(selector))
      .filter(el => el !== null && el.textContent && el.textContent.trim() !== '');

    return {
      hasErrorMessage: !!errorMessage,
      hasContent: contentElements.length > 0,
      contentTexts: contentElements.map(el => el.textContent)
    };
  });

  // Removed logging;

  // Expectations
  expect(contentVerification.hasErrorMessage).toBe(false);
  expect(contentVerification.hasContent).toBe(true);
  // Removed logging;
});