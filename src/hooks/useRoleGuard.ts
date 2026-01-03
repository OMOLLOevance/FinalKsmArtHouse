import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'staff' | 'operations_manager' | 'director' | 'investor';

interface RolePermissions {
  canCreate: boolean;
  canReadAll: boolean;
  canReadOwn: boolean;
  canDelete: boolean;
}

export function useRoleGuard() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole || 'staff';

  const getPermissions = (): RolePermissions => {
    switch (userRole) {
      case 'staff':
        return {
          canCreate: true,
          canReadAll: false,
          canReadOwn: true,
          canDelete: false,
        };
      case 'operations_manager':
        return {
          canCreate: true,
          canReadAll: true,
          canReadOwn: true,
          canDelete: false,
        };
      case 'director':
      case 'investor':
        return {
          canCreate: true,
          canReadAll: true,
          canReadOwn: true,
          canDelete: true,
        };
      default:
        return {
          canCreate: false,
          canReadAll: false,
          canReadOwn: false,
          canDelete: false,
        };
    }
  };

  const permissions = getPermissions();

  const canDeleteTransaction = () => permissions.canDelete;
  const canViewAllTransactions = () => permissions.canReadAll;
  const isStaff = () => userRole === 'staff';
  const isOperationsManager = () => userRole === 'operations_manager';
  const isDirectorOrInvestor = () => ['director', 'investor'].includes(userRole);

  return {
    userRole,
    permissions,
    canDeleteTransaction,
    canViewAllTransactions,
    isStaff,
    isOperationsManager,
    isDirectorOrInvestor,
  };
}