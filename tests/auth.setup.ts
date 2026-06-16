import { test as setup } from '@playwright/test';
import { ApiClient } from '@utils/ApiClient';
import { Logger } from '@utils/Logger';
import { STORAGE_STATE } from '@config';
import { BASE_URL, BASE_URL_HOSTNAME, AUTH_STORAGE_KEY, requireCredentials } from '@/config/env';

setup('Authenticate Session State Programmatically', async ({ request, page }) => {
  const apiClient = new ApiClient(request);

  // Validate and retrieve credentials from centralized config (throws if missing).
  const { email, password } = requireCredentials();

  Logger.info(`[Auth Setup] Generating token exchange for target user: ${email}`);

  // Exchange raw credentials for an active token via the API client.
  const authData = await apiClient.generateAuthenticatedSession({ email, password });

  if (!authData.token) {
    throw new Error('Failed to generate authentication token');
  }

  // Seed the JWT into the SPA's localStorage on the UI origin. The Toolshop
  // Angular app reads the token from localStorage, so this authenticates the UI.
  await page.goto(BASE_URL);
  await page.evaluate(({ key, token }) => window.localStorage.setItem(key, token), {
    key: AUTH_STORAGE_KEY,
    token: authData.token,
  });

  // Also keep a cookie copy for any cookie-based verification/assertions.
  await page.context().addCookies([
    {
      name: 'session_auth',
      value: authData.token,
      // Cookies belong to the UI domain, not the API domain.
      domain: BASE_URL_HOSTNAME,
      path: '/',
    },
  ]);

  // Persist session cookies and localStorage origins directly to disk storage.
  await page.context().storageState({ path: STORAGE_STATE });
  Logger.info(`[Auth Setup] Cached storage state successfully written to: ${STORAGE_STATE}`);
});
