/**
 * Centralized, validated access to environment configuration.
 *
 * Keeping all `process.env` reads in a single module avoids scattered,
 * inconsistent fallbacks across the codebase and gives us one place to
 * normalize and validate values.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load .env eagerly so values are available regardless of import order.
// dotenv.config() is idempotent, so calling it here and in the Playwright
// config is harmless.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

/** Remove a single trailing slash so URLs can be joined safely. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Join a base URL and a path without producing double slashes.
 * If `pathOrUrl` is already absolute (http/https), it is returned as-is.
 */
export function resolveUrl(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${stripTrailingSlash(baseUrl)}${normalizedPath}`;
}

/** Base URL of the UI under test — used for `page.goto()` and cookies. */
export const BASE_URL = stripTrailingSlash(process.env.BASE_URL || 'https://dummyjson.com');

/**
 * Base URL of the API under test — used by the ApiClient.
 * Falls back to BASE_URL when the UI and API share a domain.
 */
export const API_BASE_URL = stripTrailingSlash(
  process.env.API_BASE_URL || process.env.BASE_URL || BASE_URL,
);

/** Hostname of the UI, derived from BASE_URL (used for cookie domains). */
export const BASE_URL_HOSTNAME = new URL(BASE_URL).hostname;

/** Authentication credentials sourced from the environment. */
export const APP_USER = process.env.APP_USER;
export const APP_PASSWORD = process.env.APP_PASSWORD;

/**
 * Path of the API login endpoint, relative to API_BASE_URL.
 * Defaults to the Toolshop API (`/users/login`); override per target.
 */
export const AUTH_LOGIN_PATH = process.env.AUTH_LOGIN_PATH || '/users/login';

/**
 * localStorage key the front-end SPA reads the JWT from.
 * Defaults to the Toolshop Angular app's key (`auth-token`).
 */
export const AUTH_STORAGE_KEY = process.env.AUTH_STORAGE_KEY || 'auth-token';

/**
 * Assert that required auth credentials are present, returning them typed
 * as non-nullable. Throws a descriptive error otherwise.
 *
 * `APP_USER` is used as the login identifier (an email for the Toolshop API).
 */
export function requireCredentials(): { email: string; password: string } {
  if (!APP_USER || !APP_PASSWORD) {
    throw new Error(
      '❌ [Config] Missing credentials: set APP_USER and APP_PASSWORD in your .env configuration.',
    );
  }
  return { email: APP_USER, password: APP_PASSWORD };
}
