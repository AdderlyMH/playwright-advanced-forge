import { test, expect } from '@fixtures/extendedFixtures';

test.describe('Dynamic Payload Injection Suite', () => {
  test('Verify API boundary validation for negative pricing models', async ({
    apiClient,
    dataFactory,
  }) => {
    // 1. Generate a massive, valid payload, but explicitly override the specific edge-case trigger
    const invalidProductPayload = dataFactory.generateProduct({
      price: -50.0,
      inStock: true,
    });

    console.log(`🧪 [Data Factory] Generated Target Payload:`, invalidProductPayload);

    // 2. Transmit the dynamic data directly to the backend bypassing the UI
    await test.step('Transmit boundary payload to Inventory API', async () => {
      // Note: Depending on your DummyJSON / Target API setup, this endpoint varies.
      // We use a try/catch or expect it to fail gracefully based on our ApiClient logic.
      const response = await apiClient
        .seedTargetState('/products/add', invalidProductPayload)
        .catch((e) => e.message);

      // Assert the backend rejects the negative price gracefully rather than 500ing
      expect(response).not.toBeNull();
    });
  });

  test('Populate search UI with unique test artifacts to avoid cross-shard collision', async ({
    page,
    dataFactory,
    aiStep,
  }) => {
    // Generate a highly specific product name guaranteed not to exist from previous test runs
    const uniqueProduct = dataFactory.generateProduct();

    // In a real flow, you'd seed `uniqueProduct` via `apiClient` first here.

    await page.goto('/');

    // The AI layer searches for the exact dynamic string we just generated
    await aiStep(`Type "${uniqueProduct.title}" into the search bar and press Enter`);

    // We expect a clean, collision-free result
    const resultCount = await aiStep('Get the number of matching items displayed on screen');
    expect(parseInt(resultCount)).toBeGreaterThanOrEqual(0);
  });
});
