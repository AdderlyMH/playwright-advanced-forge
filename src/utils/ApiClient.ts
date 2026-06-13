import { APIRequestContext, APIResponse } from '@playwright/test';
import { AuthCredentials, AuthResponse } from '@/types';
import { Logger } from '@utils/Logger';

export class ApiClient {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
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

  async generateAuthenticatedSession(payload: AuthCredentials, retries = 3): Promise<AuthResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.request.post('/auth/login', {
          data: payload,
          timeout: 10000,
        });
        await this.validatedResponse(response, 'Failed to authenticate user state');

        const data = await response.json();
        if (!data.accessToken) {
          throw new Error('Authentication response missing accessToken field');
        }
        return { token: data.accessToken };
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
    const response = await this.request.post(endpoint, { data: statePayload });
    await this.validatedResponse(response, `Data provisioning failure at endpoint: ${endpoint}`);
    return (await response.json()) as T;
  }
}
