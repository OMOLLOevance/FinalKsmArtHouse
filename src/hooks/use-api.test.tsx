import { renderHook, waitFor } from '@testing-library/react';
import { useLogin, useRegister } from './use-api';
import { authService } from '@/services/auth.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';


jest.mock('@/services/auth.service', () => ({
  authService: {
    login: jest.fn((data) => Promise.resolve({ token: 'mock-token' })),
    register: jest.fn((data) => Promise.resolve({ token: 'mock-token' })),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLogin', () => {
  it('should call authService.login and invalidate queries on success', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: 'test@test.com', password: 'password' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Login successful');
  });
});

describe('useRegister', () => {
  it('should call authService.register and invalidate queries on success', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: 'test@test.com', password: 'password' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authService.register).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Registration successful');
  });
});