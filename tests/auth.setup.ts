import { test as setup } from "@playwright/test";
import { ApiClient } from "@utils/ApiClient";
import { STORAGE_STATE } from "../playwright.config";

setup('Authenticate Session State Programmatically', async ({ request, page }) => {
    const apiClient = new ApiClient(request);

    // Real programmatic login invocation (Fallback to safe defaults or CI secrets)
    const username = process.env.APP_USER;
    const password = process.env.APP_PASSWORD;

    if (!username || !password) {
        throw new Error('❌ [Auth Setup] Core Failure: APP_USER or APP_PASSWORD is missing from your .env configuration.');
    }

    console.log(`[Auth Setup] Generating token exchange for target user: ${username}`);

    // Exchanging raw credentials for an active token string via your ApiClient utility
    const authData = await apiClient.generateAuthenticatedSession({ username, password });

    if (!authData.token) {
        throw new Error('Failed to generate authentication token');
    }

    await page.context().addCookies([{
        name: 'session_auth',
        value: authData.token,
        domain: 'dummyjson.com', // Map directly to the target system app domain context
        path: '/'
    }])

    // Persist session cookies and storage variables directly to disk storage
    await page.context().storageState({ path: STORAGE_STATE });
    console.log(`[Auth Setup] Cached storage state successfully written to: ${STORAGE_STATE}`);
})