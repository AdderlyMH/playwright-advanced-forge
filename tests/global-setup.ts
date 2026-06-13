/**
 * ============================================
 * Global Setup Hook
 * ============================================
 *
 * Runs once before all tests in the entire test session
 * Use this for:
 * - Database initialization/migration
 * - API authentication and token generation
 * - Server startup verification (via HTTP health checks)
 * - Test data seeding
 * - Environment variable validation
 *
 * Note: Browser initialization is NOT performed here - browsers are
 * exclusively reserved for UI/E2E test execution in isolated worker processes.
 * This keeps global setup lightweight and fast.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalSetup(): Promise<void> {
    console.log('🚀 [Global Setup] Initializing test environment...');

    /**
     * Validate required environment variables
     * Ensures all necessary configs are present before tests run
     */
    const requiredEnvVars = ['BASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        console.warn(`⚠️  [Global Setup] Missing environment variables: ${missingEnvVars.join(', ')}`);
        console.log(`    Using default values from playwright.config.ts`);
    }

    /**
     * API Base URL configuration
     * Defaults to GitHub API for testing purposes
     * Override with BASE_URL environment variable for real backend
     */
    const baseURL = process.env.BASE_URL || 'https://api.github.com';
    console.log(`📍 [Global Setup] Target API Base URL: ${baseURL}`);

    /**
     * ============================================
     * HTTP Health Check (Lightweight Alternative)
     * ============================================
     *
     * Uses Node.js native fetch API instead of launching a browser.
     * This keeps global setup fast and isolated from browser workers.
     *
     * Benefits:
     * - No browser overhead in global hooks
     * - Faster startup times
     * - Cleaner resource management
     * - Browsers reserved exclusively for UI tests
     */
    try {
        // Skip health check for GitHub API (it's always available)
        if (!baseURL.includes('api.github.com')) {
            await verifyAPIHealthViaFetch(baseURL);
        } else {
            console.log(`✓ [Global Setup] GitHub API check skipped (always available)`);
        }
    } catch (error) {
        console.error(`❌ [Global Setup] Failed to initialize test environment:`, error);
        throw error;
    }

    /**
     * Optional: Initialize global test data
     * Example: API calls to create test fixtures
     */
    console.log(`✓ [Global Setup] Test environment ready`);
    console.log(`📊 [Global Setup] CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);
    console.log(`⚙️  [Global Setup] Test Timeout: ${process.env.TEST_TIMEOUT || 30000}ms`);
    console.log(`👷 [Global Setup] Workers: ${process.env.WORKERS || 'auto'}`);
}

/**
 * Performs lightweight HTTP health check on the API endpoint
 *
 * Uses Node.js native fetch API to verify the API is accessible
 * without launching an expensive browser process. This is ideal for
 * global setup/teardown hooks which should be fast and minimal.
 *
 * @async
 * @param {string} baseURL - The API base URL to check
 * @returns {Promise<void>} Resolves if health check passes
 * @throws {Error} If health check fails after retries
 */
async function verifyAPIHealthViaFetch(baseURL: string): Promise<void> {
    const maxRetries = 3;
    const retryDelayMs = 1000;
    const timeoutMs = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📡 [Global Setup] Health check attempt ${attempt}/${maxRetries}...`);

            /**
             * Use AbortController for timeout handling
             * Native fetch doesn't have built-in timeout
             */
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                /**
                 * Attempt HEAD request first (lightweight)
                 * Falls back to GET if HEAD not supported
                 */
                const response = await fetch(baseURL, {
                    method: 'HEAD',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok || response.status === 405) {
                    // 405 Method Not Allowed means server exists but doesn't support HEAD
                    console.log(`✓ [Global Setup] API is accessible (HTTP ${response.status})`);
                    return;
                }

                if (response.status === 404) {
                    console.warn(`⚠️  [Global Setup] API returned 404 - endpoint may not exist`);
                    return;
                }

                // Server error - retry
                console.warn(`⚠️  [Global Setup] API returned HTTP ${response.status}, retrying...`);
            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                // If HEAD failed, try GET request
                if (fetchError.name === 'AbortError') {
                    console.warn(`⚠️  [Global Setup] HEAD request timeout, trying GET...`);
                } else {
                    console.warn(`⚠️  [Global Setup] HEAD request failed: ${fetchError.message}`);
                }

                // Try GET request as fallback
                try {
                    const getResponse = await fetch(baseURL, {
                        method: 'GET',
                        signal: AbortSignal.timeout(timeoutMs),
                    });

                    if (getResponse.ok || getResponse.status === 404 || getResponse.status === 405) {
                        console.log(`✓ [Global Setup] API is accessible via GET (HTTP ${getResponse.status})`);
                        return;
                    }
                } catch (getError: any) {
                    console.warn(`⚠️  [Global Setup] GET request also failed: ${getError.message}`);
                }
            }

            // Wait before retry
            if (attempt < maxRetries) {
                console.log(`⏳ [Global Setup] Waiting ${retryDelayMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
        } catch (error: any) {
            if (attempt === maxRetries) {
                throw new Error(`[Global Setup] Failed to verify API health after ${maxRetries} attempts: ${error.message}`);
            }
        }
    }

    throw new Error(`[Global Setup] API health check failed after ${maxRetries} attempts`);
}

export default globalSetup;



