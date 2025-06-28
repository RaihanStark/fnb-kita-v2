// API client utility for making authenticated requests
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(response.status, errorMessage);
  }

  // Handle empty responses
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  
  post: <T = any>(url: string, data?: any) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: <T = any>(url: string, data?: any) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: <T = any>(url: string, data?: any) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};