import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { Loader2 } from 'lucide-react';
import { RoleId } from '../types';
import { hasPermission, type Permission } from '../services/rbac';
import { logger } from '../services/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleId[];
  requiredPermission?: Permission;
}

/**
 * Route guard with role-based access control and audit logging.
 * 
 * Supports two authorization modes:
 * - `allowedRoles`: Legacy role-list check (backward compatible)
 * - `requiredPermission`: Granular RBAC permission check (preferred)
 * 
 * All denied access attempts are logged for security audit.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, profile, tenant, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based check (legacy mode)
  if (allowedRoles && profile && !allowedRoles.includes(profile.role_id)) {
    logger.warn('Access denied — role not in allowedRoles', {
      userId: user.uid,
      role: profile.role_id,
      allowedRoles: allowedRoles.join(', '),
      path: location.pathname,
      tenantId: tenant?.id || 'unknown',
    });
    return <Navigate to="/" replace />;
  }

  // Permission-based check (RBAC mode)
  if (requiredPermission && profile && !hasPermission(profile.role_id, requiredPermission)) {
    logger.warn('Access denied — insufficient permission', {
      userId: user.uid,
      role: profile.role_id,
      requiredPermission,
      path: location.pathname,
      tenantId: tenant?.id || 'unknown',
    });
    return <Navigate to="/" replace />;
  }

  // Tenant isolation check — ensure user has an active tenant
  if (profile && !profile.tenant_id) {
    logger.warn('Access denied — user has no tenant association', {
      userId: user.uid,
      path: location.pathname,
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
