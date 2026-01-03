export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'staff' | 'operations_manager' | 'director' | 'investor';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}
