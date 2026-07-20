const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

import { useAuthStore } from '@/lib/auth-store';

class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(url: string, getToken: () => string | null) {
    this.baseUrl = url;
    this.getToken = getToken;
  }

  private handleUnauthorized() {
    // Token expired/invalid: clear session and send to login (browser only).
    if (typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Invalid or expired token');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

let apiClient: ApiClient | null = null;

export function createApiClient(getToken: () => string | null): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient(API_BASE, getToken);
  }
  return apiClient;
}

export function getApiClient(): ApiClient | null {
  return apiClient;
}