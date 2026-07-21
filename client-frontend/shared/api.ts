/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { email: string };
}

export interface ProfileRequest {
  name: string;
  age: number;
  experience: string;
  hardestPart: string;
  support: string;
}

export interface ProfileResponse {
  profile: ProfileRequest;
  onboardingComplete: boolean;
}
