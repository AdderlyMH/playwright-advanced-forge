import { APIRequestContext, APIResponse } from '@playwright/test';
import { AuthCredentials, AuthResponse } from '@/types';
import { Logger } from '@utils/Logger';
import { API_BASE_URL, AUTH_LOGIN_PATH, resolveUrl } from '@/config/env';

export class ApiClient {
  private request: APIRequestContext;
  private apiBaseUrl: string;

  /**
   * @param request   Playwright APIRequestContext (may be bound to the UI baseURL).
   * @param apiBaseUrl Base URL for API calls. Defaults to the resolved API_BASE_URL,
   *                   which allows the API to live on a different domain than the UI.
   */
  constructor(request: APIRequestContext, apiBaseUrl: string = API_BASE_URL) {
    this.request = request;
    this.apiBaseUrl = apiBaseUrl;
  }

  private async validatedResponse(
    response: APIResponse,
    contextualErrorMessage: string,
  ): Promise<void> {
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(
        `[API Failure] ${contextualErrorMessage} | Status: ${response.status()} | Details: ${body}`,
      );
    }
  }

  /**
   * Parse a response as JSON, raising a descriptive error if the server
   * returned a non-JSON payload (e.g. an HTML error page).
   */
  private async parseJson<T = unknown>(response: APIResponse, context: string): Promise<T> {
    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      const body = await response.text();
      throw new Error(
        `[API Failure] ${context} | Expected JSON but received '${contentType || 'unknown'}' ` +
          `from ${response.url()} | Body starts with: ${body.slice(0, 120)}`,
      );
    }
    return (await response.json()) as T;
  }

  async generateAuthenticatedSession(payload: AuthCredentials, retries = 3): Promise<AuthResponse> {
    let lastError: Error | undefined;
    const url = resolveUrl(this.apiBaseUrl, AUTH_LOGIN_PATH);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        Logger.debug(`Auth attempt ${attempt}/${retries} -> POST ${url}`);
        const response = await this.request.post(url, {
          data: payload,
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
        await this.validatedResponse(response, 'Failed to authenticate user state');

        const data = await this.parseJson<{
          access_token?: string;
          accessToken?: string;
          token?: string;
        }>(response, 'Failed to parse authentication response');
        const token = data.access_token ?? data.accessToken ?? data.token;
        if (!token) {
          throw new Error('Authentication response missing access_token/accessToken/token field');
        }
        return { token };
      } catch (error) {
        lastError = error as Error;
        Logger.debug(`Auth attempt ${attempt}/${retries} failed`, lastError.message);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError ?? new Error('Failed to generate authenticated session');
  }

  async seedTargetState<T = unknown>(endpoint: string, statePayload: object): Promise<T> {
    const url = resolveUrl(this.apiBaseUrl, endpoint);
    const response = await this.request.post(url, { data: statePayload });
    await this.validatedResponse(response, `Data provisioning failure at endpoint: ${endpoint}`);
    return this.parseJson<T>(response, `Failed to parse response from ${endpoint}`);
  }
}
