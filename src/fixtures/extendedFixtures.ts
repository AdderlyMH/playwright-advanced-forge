import { test as base, expect } from '@playwright/test';
import { ApiClient } from '@utils/ApiClient';
import { User } from '@/types';

export type CustomFixtures = {
  apiClient: ApiClient;
  seededUser: User;
};

export const test = base.extend<CustomFixtures>({
  // Provide a clean instance of the API wrapper to every test execution block
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await use(client);
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
