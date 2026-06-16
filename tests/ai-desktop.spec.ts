import { test, expect } from '@fixtures/extendedFixtures';
import { Page } from '@playwright/test';

// ─── Shared test logic ────────────────────────────────────────────────────────
async function runProductSearchFlow(page: Page, aiStep: (prompt: string) => Promise<string>) {
  // 1. DETERMINISTIC CORE
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
  await page.getByRole('link', { name: 'Home' }).click();

  // 2. ADAPTIVE AI TIER
  await aiStep('Find the search bar, type "pliers" into it and press enter.');

  // 3. AI DATA EXTRACTION
  const topResultTitle = await aiStep(
    'Get the name of the first product in the search results list',
  );
  const topResultPrice = await aiStep('Get the numerical price of the first product as a string');
  // 3. AI DATA EXTRACTION
  // const topResultTitle = await aiStep(
  //     'Return the text of the first product heading in the search results grid'
  // );
  // const topResultPrice = await aiStep(
  //     'Return the price text of the first product card in the search results grid, for example "$14.15"'
  // );
  const priceNumeric = parseFloat(topResultPrice.replace(/[^\d.]/g, ''));

  console.log(`📦 Extracted Product: ${topResultTitle} at $${priceNumeric}`);

  // 4. DETERMINISTIC ASSERTIONS
  expect(topResultTitle.toLowerCase()).toContain('pliers');
  expect(priceNumeric).toBeGreaterThan(0);
}

// ─── Desktop Suite ────────────────────────────────────────────────────────────
test.describe('Hybrid E2E Suite: Desktop', () => {
  // Runs on chromium, firefox, webkit (from playwright.config.ts)
  // No test.use() override needed — uses the default viewport

  test('Search and extract dynamic inventory data using semantic prompts', async ({
    page,
    aiStep,
  }) => {
    await runProductSearchFlow(page, aiStep);
  });
});
