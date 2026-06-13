/**
 * ============================================
 * Global Teardown Hook
 * ============================================
 *
 * Runs once after all tests complete in the entire test session
 * Use this for:
 * - Cleanup of test data
 * - Database reset/cleanup
 * - Server shutdown
 * - Report aggregation
 * - Log collection
 * - Resource cleanup (temporary files, etc.)
 *
 * @async
 * @returns {Promise<void>}
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */
async function globalTeardown(): Promise<void> {
    console.log('🧹 [Global Teardown] Cleaning up test environment...');

    try {
        /**
         * Optional: Clean up test data
         * Example: Delete test users, reset database state, etc.
         */
        console.log('📊 [Global Teardown] Test session statistics:');
        console.log(`   - Workers configured: ${process.env.WORKERS || 'auto'}`);
        console.log(`   - Test timeout: ${process.env.TEST_TIMEOUT || 30000}ms`);

        /**
         * Optional: Aggregate test results
         * Example: Parse reports, send notifications, etc.
         */
        const reportDir = process.env.REPORT_DIR || 'test-results';
        console.log(`📁 [Global Teardown] Test results location: ${reportDir}`);

        /**
         * Optional: Database cleanup
         * Example: Truncate test tables, reset state, etc.
         */
        if (process.env.CLEANUP_DB === 'true') {
            console.log('🗑️  [Global Teardown] Database cleanup enabled');
            // Add database cleanup logic here
        }

        /**
         * Optional: Stop external services
         * Example: Docker containers, test servers, etc.
         */
        if (process.env.RUN_SERVER === 'true') {
            console.log('🛑 [Global Teardown] Stopping dev server...');
            // Server will be stopped automatically by Playwright
        }

        /**
         * Optional: Generate reports
         * Example: Merge Allure reports, create summaries, etc.
         */
        console.log('📝 [Global Teardown] Generating test reports:');
        console.log('   - HTML Report: playwright-report/index.html');
        console.log('   - Allure Report: allure-results/');
        console.log('   - JUnit XML: test-results/junit.xml');
        console.log('   - JSON Report: test-results/results.json');

        console.log('✓ [Global Teardown] Cleanup completed successfully');
    } catch (error) {
        console.error('❌ [Global Teardown] Error during cleanup:', error);
        // Don't throw - allow tests to complete even if cleanup fails
    }

    /**
     * Optional: Exit code management
     * Example: Set exit code based on test results
     */
    if (process.env.CI === 'true') {
        console.log('ℹ️  [Global Teardown] CI mode enabled - check logs for test results');
    }
}

export default globalTeardown;

