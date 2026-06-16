import { test as base, expect } from '@playwright/test';
import { ApiClient } from '@utils/ApiClient';
import { ai } from '@zerostep/playwright';
import { User } from '@/types';

export type CustomFixtures = {
  apiClient: ApiClient;
  aiStep: (prompt: string) => Promise<any>;
  seededUser: User;
};

export const test = base.extend<CustomFixtures>({
  // Provide a clean instance of the API wrapper to every test execution block
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await use(client);
  },

  // Adaptive AI Layer
  aiStep: async ({ page }, use) => {
    // We encapsulate the AI call to provide standardized logging and context injection
    const aiExecutor = async (prompt: string) => {
      return await base.step(`AI Step: ${prompt}`, async () => {
        // Pass a stub that swallows ZeroStep's internal step() call
        const testStub = {
          ...base,
          step: async (_name: string, fn: () => Promise<any>) => fn(),
        } as typeof base;
        // The ai() function natively reads the page's accessibility tree
        return await ai(prompt, { page, test: testStub });
      });
    };

    await use(aiExecutor);
  },

  // Provide deterministic metadata about the user identity currently cached in storageState
  seededUser: async ({}, use) => {
    await use({
      id: 'USR-89912',
      username: 'emilys',
      token: 'ADMIN_PRO',
    });
  },
});

export { expect };
