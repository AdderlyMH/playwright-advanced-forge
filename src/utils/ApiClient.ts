import { APIRequestContext, APIResponse } from "@playwright/test";

export class ApiClient {
    private request: APIRequestContext

    constructor(request: APIRequestContext) {
        this.request = request
    }

    private async validatedResponse(response: APIResponse, contextualErrorMessage: string) {
        if (!response.ok()) {
            const body = await response.text()
            throw new Error(`[API Failure] ${contextualErrorMessage} | Status: ${response.status()} | Details: ${body}`)
        }
    }

    async generateAuthenticatedSession(payload: Record<string, any>): Promise<Record<string, string>> {
        const response = await this.request.post('/auth/login', { data: payload })
        await this.validatedResponse(response, 'Failed to authenticate user state')

        const data = await response.json()
        return { token: data.accessToken }
    }

    async seedTargetState(endpoint: string, statePayload: object) {
        const response = await this.request.post(endpoint, { data: statePayload })
        await this.validatedResponse(response, `Data provisioning failure at endpoint: ${endpoint}`)
    }
}