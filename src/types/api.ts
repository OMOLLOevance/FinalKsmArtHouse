import { InputSanitizer } from '@/lib/sanitizer';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
}

// Generic type-safe fetch wrapper
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Validate and sanitize the endpoint URL
  const sanitizedEndpoint = InputSanitizer.sanitizeUrl(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
  
  const response = await fetch(sanitizedEndpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }
  
  return response.json();
}