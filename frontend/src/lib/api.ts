const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiError extends Error {
  status: number;
  errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include',
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: { message?: string; errors?: string[] } = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore parse error
    }

    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData.errors
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }
  return request<T>(url, { method: 'GET' });
}

export function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function patch<T>(endpoint: string, data: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

export { ApiError };
export type { ApiResponse, PaginatedResponse } from '@/types';
