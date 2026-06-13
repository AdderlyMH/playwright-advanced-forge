/**
 * Shared type definitions for the test automation framework.
 */

export interface User {
  id: string;
  username: string;
  email?: string;
  token?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
