/**
 * Generic API Client
 * Handles all HTTP requests to the backend
 * 
 * Usage:
 * import { apiGet, apiPost } from '@/services/apiClient';
 * const data = await apiGet('/reports');
 */

// Get API base URL from environment variables
// For development: http://localhost:3000/api
// For production: Set in .env file as VITE_API_BASE_URL=https://your-api.com/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Response wrapper (matches backend response format)
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Get authentication token from storage
 * Checks both 'token' and 'authToken' for compatibility
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token') || 
         localStorage.getItem('authToken') || 
         sessionStorage.getItem('token') || 
         sessionStorage.getItem('authToken');
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = getAuthToken();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: APIResponse<T> = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed: ${response.statusText}`);
    }

    // Handle API-level errors
    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * GET request
 * @param endpoint - API endpoint (e.g., '/reports' or '/reports/123')
 * @returns Promise with the data from the API response
 * 
 * @example
 * const reports = await apiGet('/reports');
 * const report = await apiGet(`/reports/${id}`);
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * POST request
 * @param endpoint - API endpoint
 * @param body - Data to send (will be JSON stringified)
 * @returns Promise with the data from the API response
 * 
 * @example
 * const result = await apiPost('/reports/upload', { file: '...', type: 'ecg' });
 */
export async function apiPost<T>(
  endpoint: string,
  body: any
): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * POST request with FormData (for file uploads)
 * @param endpoint - API endpoint
 * @param formData - FormData object
 * @returns Promise with the data from the API response
 * 
 * @example
 * const formData = new FormData();
 * formData.append('file', file);
 * const result = await apiPostForm('/reports/upload', formData);
 */
export async function apiPostForm<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData, browser will set it with boundary

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `API request failed: ${response.statusText}`);
    }

    const data: APIResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    if (!data.data) {
      throw new Error('No data returned from API');
    }

    return data.data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

/**
 * PUT request
 * @param endpoint - API endpoint
 * @param body - Data to send
 * @returns Promise with the data from the API response
 */
export async function apiPut<T>(
  endpoint: string,
  body: any
): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

/**
 * DELETE request
 * @param endpoint - API endpoint
 * @returns Promise with the data from the API response
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'DELETE',
  });

  if (!response.data) {
    throw new Error('No data returned from API');
  }

  return response.data;
}

