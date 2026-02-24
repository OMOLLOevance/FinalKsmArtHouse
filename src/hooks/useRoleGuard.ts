import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useMemo } from 'react';

type UserRole = 'staff' | 'operations_manager' | 'director' | 'investor' | 'admin';

interface RolePermissions {
  canCreate: boolean;
  canReadAll: boolean;
  canReadOwn: boolean;
  canDelete: boolean;
}

export function useRoleGuard() {
  const { user } = useAuth();
  const userRole = (user?.role as UserRole) || 'staff';

  const permissions = useMemo((): RolePermissions => {
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
      case 'admin':
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
  }, [userRole]);

  const canDeleteTransaction = useCallback(() => permissions.canDelete, [permissions]);
  const canViewAllTransactions = useCallback(() => permissions.canReadAll, [permissions]);
  const isStaff = useCallback(() => userRole === 'staff', [userRole]);
  const isAdmin = useCallback(() => userRole === 'admin', [userRole]);
  const isOperationsManager = useCallback(() => userRole === 'operations_manager', [userRole]);
  const isDirectorOrInvestor = useCallback(() => ['director', 'investor', 'admin'].includes(userRole), [userRole]);
  const isManager = useCallback(() => ['director', 'investor', 'admin', 'operations_manager'].includes(userRole), [userRole]);

  return useMemo(() => ({
    userRole,
    permissions,
    canDeleteTransaction,
    canViewAllTransactions,
    isStaff,
    isAdmin,
    isOperationsManager,
    isDirectorOrInvestor,
    isManager,
  }), [userRole, permissions, canDeleteTransaction, canViewAllTransactions, isStaff, isAdmin, isOperationsManager, isDirectorOrInvestor, isManager]);
}