import { test, expect } from '@fixtures/extendedFixtures';

// ─── Mobile Suite ─────────────────────────────────────────────────────────────
test.describe('Hybrid E2E Suite: Mobile', () => {
  // Override viewport and user agent to simulate a mobile device
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true,
    isMobile: true,
  });

  test('Search and extract dynamic inventory data using semantic prompts', async ({
    page,
    aiStep,
  }) => {
    // Structural Metadata for Stakeholder Dashboards
    test.info().annotations.push({ type: 'epic', description: 'Catalog Management' });
    test.info().annotations.push({ type: 'feature', description: 'Product Search Experience' });
    test.info().annotations.push({
      type: 'story',
      description: 'AI-Assisted Resilient Search Verification',
    });

    // Mobile-specific AI prompt — hamburger menus, bottom navbars, etc.
    await page.goto('/contact');
    // Standard UI synchronizer step
    await test.step('Pre-condition: Wait for contact grid to hydrate', async () => {
      await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    });

    // Mobile navigation may differ — AI handles it adaptively
    await aiStep('Open the navigation menu and tap the Home link.');

    // Wait specifically for the filter button to be ready
    //await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Filters' }).click();

    // Reuse shared extraction + assertion logic
    await aiStep('Find the search bar, type "pliers" into it and press enter.');

    const topResultTitle = await aiStep(
      'Get the name of the first product in the search results list',
    );
    const topResultPrice = await aiStep('Get the numerical price of the first product as a string');
    const priceNumeric = parseFloat(topResultPrice.replace(/[^\d.]/g, ''));

    console.log(`📱 [Mobile] Extracted Product: ${topResultTitle} at $${priceNumeric}`);

    await test.step('Assertion: Validate extracted data contracts match specifications', async () => {
      //expect(topResultTitle.toLowerCase()).toContain('pliers');
      expect(priceNumeric).toBeGreaterThan(0);
    });
  });
});
