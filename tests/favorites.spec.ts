import { test, expect } from '@playwright/test';

test.describe('Favorites Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set user settings in localStorage BEFORE navigating
    page.addInitScript(() => {
      localStorage.setItem('wordgym_user_settings_v1', JSON.stringify({
        stage: 'senior',
        version: '龍騰'
      }));
      // Clear any existing favorites
      localStorage.removeItem('mvp_vocab_favorites');
    });

    // Navigate to home page (dev server)
    await page.goto('/');

    // Wait for data to load
    await page.waitForSelector('text=/單字健身坊|WordGym/i', { timeout: 15000 });
  });

  test('Favorites functionality end-to-end', async ({ page }) => {
    // Step 1: Check initial localStorage for favorites
    const initialFavorites = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : null;
    });
    expect(initialFavorites).toBeNull();

    // Step 2: Navigate to home and wait for words to load
    await page.waitForSelector('button:has-text("大考衝刺")', { timeout: 10000 });

    // Click on "大考衝刺" tab to ensure words are displayed
    await page.getByRole('button', { name: '大考衝刺' }).click();

    // Wait for words to appear
    await page.waitForSelector('text=/符合條件的單字：/', { timeout: 10000 });

    // Step 3: Wait for data to fully load by checking for word count
    await page.waitForTimeout(2000); // Give time for Google Sheets to load

    // Navigate directly to a word detail page (assuming word ID 1 exists)
    // This avoids the complexity of finding word cards on the home page
    await page.goto('/#/word/1');

    // Step 4: Wait for word detail page to load
    await page.waitForSelector('button:has-text("加入重點訓練")', { timeout: 10000 });

    // Step 5: The word ID is 1 (we navigated to #/word/1)
    const wordId = 1;
    // Removed logging;

    // Step 6: Click "加入重點訓練" button
    const addFavoriteButton = page.getByRole('button', { name: '加入重點訓練' });
    await addFavoriteButton.click();

    // Step 7: Verify button text changes to "移除重點訓練"
    await expect(page.getByRole('button', { name: '移除重點訓練' })).toBeVisible({ timeout: 3000 });

    // Step 8: Check localStorage was updated
    const favoritesAfterAdd = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : [];
    });
    // Removed logging;
    expect(favoritesAfterAdd).toContain(wordId);
    expect(favoritesAfterAdd.length).toBe(1);

    // Step 9: Navigate to favorites page
    await page.goto('/#/favorites');

    // Step 10: Wait for favorites page to load
    await page.waitForSelector('text=/重點訓練/i', { timeout: 10000 });

    // Step 11: Verify the count shows (1) instead of (0)
    await expect(page.getByRole('heading', { name: /重點訓練 \(1\)/i })).toBeVisible({ timeout: 5000 });

    // Step 12: Verify the word appears in the favorites list
    const favoriteWordCards = page.locator('.bg-white.rounded-xl.shadow-sm');
    await expect(favoriteWordCards).toHaveCount(1);

    // Step 13: Verify "開始測驗" and "全部清除" buttons are visible
    await expect(page.getByRole('button', { name: '開始測驗' })).toBeVisible();
    await expect(page.getByRole('button', { name: '全部清除' })).toBeVisible();

    // Step 14: Test remove functionality
    const removeButton = page.getByRole('button', { name: '移除' });
    await removeButton.click();

    // Step 15: Verify count returns to (0)
    await expect(page.getByRole('heading', { name: /重點訓練 \(0\)/i })).toBeVisible({ timeout: 3000 });

    // Step 16: Verify empty state message appears
    await expect(page.getByText('尚未加入任何重點訓練單字')).toBeVisible();

    // Step 17: Verify localStorage was cleared
    const favoritesAfterRemove = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : [];
    });
    expect(favoritesAfterRemove.length).toBe(0);
  });

  test('Check localStorage structure and identify bug', async ({ page }) => {
    // Listen to console messages from the page
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Add a favorite word manually via localStorage
    await page.evaluate(() => {
      localStorage.setItem('mvp_vocab_favorites', JSON.stringify([1, 2, 3]));
    });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Navigate to favorites page
    await page.goto('/#/favorites');

    // Wait for favorites page
    await page.waitForSelector('text=/重點訓練/i', { timeout: 10000 });

    // Wait a bit for console logs to appear
    await page.waitForTimeout(1000);

    // Print console logs
    consoleMessages.forEach(msg => console.log(msg));

    // Verify localStorage structure
    const favorites = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : null;
    });

    expect(Array.isArray(favorites)).toBe(true);
    expect(favorites).toEqual([1, 2, 3]);

    // Check what the actual count shows
    const headingText = await page.getByRole('heading', { name: /重點訓練/i }).textContent();

    // This is the BUG: localStorage has [1,2,3] but count shows (0)
    // Expected: "重點訓練 (3)" or at least some count > 0
    // Actual: "重點訓練 (0)"
    console.log('Heading text:', headingText);
  });

  test('Favorites persist across page reloads', async ({ page }) => {
    // Navigate to home
    await page.waitForSelector('button:has-text("大考衝刺")', { timeout: 10000 });

    // Click on "大考衝刺" tab to ensure words are displayed
    await page.getByRole('button', { name: '大考衝刺' }).click();

    // Wait for words to appear
    await page.waitForSelector('text=/符合條件的單字：/', { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Navigate directly to a word detail page
    await page.goto('/#/word/1');

    // Add to favorites
    await page.waitForSelector('button:has-text("加入重點訓練")', { timeout: 10000 });
    const addFavoriteButton = page.getByRole('button', { name: '加入重點訓練' });
    await addFavoriteButton.click();

    // Wait for state update
    await expect(page.getByRole('button', { name: '移除重點訓練' })).toBeVisible({ timeout: 3000 });

    // Get favorites before reload
    const favoritesBeforeReload = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : [];
    });

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector('text=/單字健身坊|WordGym/i', { timeout: 10000 });

    // Get favorites after reload
    const favoritesAfterReload = await page.evaluate(() => {
      const raw = localStorage.getItem('mvp_vocab_favorites');
      return raw ? JSON.parse(raw) : [];
    });

    // Verify favorites persisted
    expect(favoritesAfterReload).toEqual(favoritesBeforeReload);
    expect(favoritesAfterReload.length).toBeGreaterThan(0);
  });

  test('Loading state shows spinner and correct count after load', async ({ page }) => {
    // Add favorites to localStorage after page is loaded (like the other test)
    await page.evaluate(() => {
      localStorage.setItem('mvp_vocab_favorites', JSON.stringify([1, 2, 3]));
    });

    // Wait for data to load (Google Sheets)
    await page.waitForTimeout(2000);

    // Navigate to favorites page
    await page.goto('/#/favorites');

    // Verify loading state appears
    const loadingText = page.getByText('載入中...');
    const loadingSpinner = page.locator('.animate-spin');

    // Check if loading state is visible (within first 1 second)
    const loadingVisible = await Promise.race([
      loadingText.isVisible().catch(() => false),
      page.waitForTimeout(1000).then(() => false)
    ]);

    if (loadingVisible) {
      // Removed logging;
      // Verify loading message and spinner are visible
      await expect(loadingText).toBeVisible();
      await expect(loadingSpinner).toBeVisible();
      // Removed logging;
    } else {
      // Removed logging');
    }

    // Wait for data to load - the heading should appear
    await page.waitForSelector('h1:has-text("重點訓練")', { timeout: 10000 });

    // Verify final count shows correct number (3)
    await expect(page.getByRole('heading', { name: /重點訓練 \(3\)/i })).toBeVisible({ timeout: 5000 });

    const finalHeading = await page.getByRole('heading', { name: /重點訓練/i }).textContent();
    // Removed logging;

    // Verify the count is correct
    expect(finalHeading).toContain('(3)');
    expect(finalHeading).not.toContain('(0)');

    // Verify loading state has disappeared
    await expect(loadingText).not.toBeVisible();

    // Verify the word cards are displayed
    const favoriteWordCards = page.locator('.bg-white.rounded-xl.shadow-sm');
    const cardCount = await favoriteWordCards.count();
    // Removed logging;

    // Should have 3 word cards (one for each favorite)
    expect(cardCount).toBeGreaterThan(0);
  });
});
