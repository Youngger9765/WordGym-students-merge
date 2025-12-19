import { test, expect } from '@playwright/test';

test.describe('Quiz Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set user settings in localStorage BEFORE navigating
    await page.addInitScript(() => {
      localStorage.setItem('wordgym_user_settings_v1', JSON.stringify({
        stage: 'senior',
        version: '龍騰'
      }));
    });

    // Navigate to quiz page
    await page.goto('/#/quiz');

    // Wait for data to load (check for the quiz configuration heading)
    await page.waitForSelector('text=Quiz Configuration', { timeout: 10000 });

    // Wait for words to finish loading (button changes from "Loading..." to "Start")
    await page.waitForSelector('button:has-text("Start")', { timeout: 15000 });
  });

  test('Quiz Configuration Page Renders', async ({ page }) => {
    // Check quiz type buttons (use exact match to avoid matching "Start Multiple Choice Quiz")
    await expect(page.getByRole('button', { name: 'Multiple Choice', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flashcard', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Writing', exact: true })).toBeVisible();
  });

  test('Multiple Choice Quiz Flow', async ({ page }) => {
    // Select multiple choice quiz (use exact match to avoid ambiguity)
    await page.getByRole('button', { name: 'Multiple Choice', exact: true }).click();

    // Configure quiz (5 questions) - use slider
    await page.getByRole('slider').fill('5');
    await page.getByRole('button', { name: /Start.*Quiz/i }).click();

    // Wait for quiz to load (check for question heading)
    await page.waitForSelector('text=/Question \\d+ of \\d+/', { timeout: 10000 });

    // Test quiz progression
    for (let i = 0; i < 5; i++) {
      // Verify question heading is displayed
      await expect(page.getByRole('heading', { name: new RegExp(`Question ${i + 1} of 5`) })).toBeVisible();

      // Get all buttons in the quiz options area (between the question and score)
      const optionsContainer = page.locator('.space-y-4.mt-6');
      const optionButtons = optionsContainer.locator('button');
      const count = await optionButtons.count();
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 options

      // Select first option button
      await optionButtons.first().click();

      // Wait for auto-progress (quiz auto-advances after 1 second)
      if (i < 4) {
        // Wait for next question heading to appear
        await page.waitForSelector(`text=/Question ${i + 2} of 5/`, { timeout: 3000 });
      } else {
        // On last question, wait for completion screen
        await page.waitForTimeout(2000);
      }
    }

    // Check completion screen appears
    await expect(page.getByText(/選擇題測驗結束|Multiple Choice.*Complete/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/正確答案|Correct/i)).toBeVisible();
  });

  test('Flashcard Quiz Flow', async ({ page }) => {
    // Set larger viewport to accommodate flashcard
    await page.setViewportSize({ width: 1280, height: 1024 });

    // Select flashcard quiz (use exact match)
    await page.getByRole('button', { name: 'Flashcard', exact: true }).click();

    // Configure quiz (5 questions) - use slider (same as multiple choice)
    await page.getByRole('slider').fill('5');
    await page.getByRole('button', { name: /Start.*Quiz/i }).click();

    // Wait for first flashcard (check for card count text)
    await page.waitForSelector('text=/Card \\d+ \\/ \\d+/', { timeout: 10000 });

    // Test flashcard progression
    for (let i = 0; i < 5; i++) {
      // Verify card counter
      await expect(page.getByText(new RegExp(`Card ${i + 1} / 5`))).toBeVisible();

      // Click on the flashcard to flip it (use JavaScript click to bypass viewport issues)
      const flashcard = page.locator('.flashcard');
      await flashcard.evaluate(el => (el as HTMLElement).click());

      // Wait for evaluation buttons to appear (they only show when flipped)
      const masteredButton = page.getByRole('button', { name: /記得/i });
      await masteredButton.waitFor({ state: 'visible', timeout: 3000 });

      // Click "Mastered" button
      await masteredButton.click();

      // Wait for next card to appear (if not last card)
      if (i < 4) {
        await page.waitForSelector(`text=/Card ${i + 2} \\/ 5/`, { timeout: 3000 });
      }
    }

    // Check completion screen
    await expect(page.getByText(/閃卡測驗結束|Flashcard.*Complete/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/已掌握的詞|Mastered/i)).toBeVisible();
  });
});