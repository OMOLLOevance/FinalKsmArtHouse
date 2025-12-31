import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export type LoginResponse = { token: string; user: User };
export type RegisterResponse = { token: string; user: User };

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Validate before sending
    LoginSchema.parse(data);
    
    return apiClient.post<LoginResponse>('/auth/login', data);
  }
  
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    RegisterSchema.parse(data);
    
    return apiClient.post<RegisterResponse>('/auth/register', data);
  }
  
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  }
  
  async refreshToken(): Promise<{ token: string }> {
    return apiClient.post('/auth/refresh');
  }
  
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }
}

export const authService = new AuthService();