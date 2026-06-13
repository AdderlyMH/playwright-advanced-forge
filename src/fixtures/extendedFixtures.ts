import { test as base, expect } from "@playwright/test";
import { ApiClient } from "@utils/ApiClient";

export type CustomFixtures = {
    apiClient: ApiClient
    seededUser: { id: string, token: string }
}

export const test = base.extend<CustomFixtures>({
    apiClient: async ({ request }, use) => {
        const client = new ApiClient(request)
        await use(client)
    },

    seededUser: async ({}, use) => {
        /**
         * Mock authenticated user for testing
         * In a real scenario, this would call your actual auth endpoint:
         * const authData = await apiClient.generateAuthenticatedSession({...})
         *
         * For GitHub API testing, we use a mock token since GitHub doesn't
         * have a /auth/login endpoint. Tests can be configured to use
         * a real backend by setting BASE_URL environment variable.
         *
         * @example
         * Real backend: BASE_URL=http://localhost:3000 npm test
         * GitHub API: npm test (uses mock token)
         */
        const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(7);

        await use({
            id: 'USR-89912',
            token: mockToken
        })
    }
})

export { expect }