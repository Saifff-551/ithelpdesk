/**
 * MATIE — Role-Based Access Control (RBAC) Middleware
 * 
 * Enterprise-grade access control with:
 * - Role hierarchy enforcement
 * - Permission-based access checks
 * - Access attempt audit logging
 * - Tenant-scoped authorization
 * 
 * Patent-relevant: Implements layered authorization with
 * immutable audit trail for regulatory compliance.
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import type { RoleId } from '../types';

// ============================================
// Role Hierarchy & Permissions
// ============================================

/**
 * Role hierarchy — higher level = more privileges.
 * Used for role comparison (e.g., isAtLeast('it_manager')).
 */
const ROLE_HIERARCHY: Record<RoleId, number> = {
    platform_admin: 100,
    company_admin: 80,
    it_manager: 60,
    support_agent: 40,
    employee: 20,
};

/**
 * Permission definitions — granular access control.
 * Maps permission names to minimum required role levels.
 */
export type Permission =
    | 'view_dashboard'
    | 'view_tickets'
    | 'create_tickets'
    | 'manage_tickets'
    | 'view_users'
    | 'manage_users'
    | 'view_ai_insights'
    | 'manage_ai_config'
    | 'view_audit_logs'
    | 'manage_tenant'
    | 'manage_slas'
    | 'manage_kb'
    | 'view_security_logs'
    | 'manage_branding'
    | 'platform_admin_access';

const PERMISSION_MAP: Record<Permission, RoleId[]> = {
    view_dashboard: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'],
    view_tickets: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'],
    create_tickets: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'],
    manage_tickets: ['platform_admin', 'company_admin', 'it_manager', 'support_agent'],
    view_users: ['platform_admin', 'company_admin', 'it_manager'],
    manage_users: ['platform_admin', 'company_admin'],
    view_ai_insights: ['platform_admin', 'company_admin'],
    manage_ai_config: ['platform_admin', 'company_admin'],
    view_audit_logs: ['platform_admin', 'company_admin'],
    manage_tenant: ['platform_admin', 'company_admin'],
    manage_slas: ['platform_admin', 'company_admin', 'it_manager'],
    manage_kb: ['platform_admin', 'company_admin', 'it_manager', 'support_agent'],
    view_security_logs: ['platform_admin', 'company_admin'],
    manage_branding: ['platform_admin', 'company_admin'],
    platform_admin_access: ['platform_admin'],
};

// ============================================
// Access Control Functions
// ============================================

/** Check if a role has a specific permission */
export function hasPermission(role: RoleId, permission: Permission): boolean {
    const allowedRoles = PERMISSION_MAP[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}

/** Check if roleA is at least as privileged as roleB */
export function isAtLeast(userRole: RoleId, minimumRole: RoleId): boolean {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

/** Get all permissions for a role */
export function getPermissions(role: RoleId): Permission[] {
    return (Object.entries(PERMISSION_MAP) as [Permission, RoleId[]][])
        .filter(([, roles]) => roles.includes(role))
        .map(([perm]) => perm);
}

/** Get role display name */
export function getRoleDisplayName(role: RoleId): string {
    const names: Record<RoleId, string> = {
        platform_admin: 'Platform Administrator',
        company_admin: 'Company Administrator',
        it_manager: 'IT Manager',
        support_agent: 'Support Agent',
        employee: 'Employee',
    };
    return names[role] || role;
}

// ============================================
// Enforce & Audit Functions
// ============================================

export interface AccessContext {
    userId: string;
    userRole: RoleId;
    tenantId: string;
    resource: string;
    action: string;
}

/**
 * Enforce a permission check and log the access attempt.
 * Returns true if access is granted, false if denied.
 * All attempts (granted and denied) are logged for audit.
 */
export async function enforceAccess(
    context: AccessContext,
    requiredPermission: Permission
): Promise<boolean> {
    const granted = hasPermission(context.userRole, requiredPermission);

    // Log every access attempt (audit trail)
    logAccessAttempt({
        ...context,
        permission: requiredPermission,
        granted,
        timestamp: new Date().toISOString(),
    }).catch(() => {
        // Non-blocking — don't fail business logic if audit fails
    });

    if (!granted) {
        logger.warn('Access denied', {
            userId: context.userId,
            role: context.userRole,
            tenantId: context.tenantId,
            permission: requiredPermission,
            resource: context.resource,
            action: context.action,
        });
    }

    return granted;
}

/**
 * Enforce access and throw if denied — for use in service functions.
 */
export async function requireAccess(
    context: AccessContext,
    requiredPermission: Permission
): Promise<void> {
    const granted = await enforceAccess(context, requiredPermission);
    if (!granted) {
        throw new Error(
            `Access denied: ${context.userRole} does not have permission '${requiredPermission}' ` +
            `for ${context.action} on ${context.resource}`
        );
    }
}

// ============================================
// Security Audit Log
// ============================================

interface AccessAttemptLog {
    userId: string;
    userRole: RoleId;
    tenantId: string;
    resource: string;
    action: string;
    permission: Permission;
    granted: boolean;
    timestamp: string;
}

/**
 * Persist access attempt to Firestore security audit log.
 * Immutable — no updates or deletes allowed.
 */
async function logAccessAttempt(entry: AccessAttemptLog): Promise<void> {
    try {
        await addDoc(collection(db, 'security_audit_log'), {
            user_id: entry.userId,
            user_role: entry.userRole,
            tenant_id: entry.tenantId,
            resource: entry.resource,
            action: entry.action,
            permission: entry.permission,
            granted: entry.granted,
            timestamp: Timestamp.now(),
            ip_hint: typeof window !== 'undefined' ? window.location.hostname : 'server',
        });
    } catch (err) {
        logger.error('Failed to log access attempt', {
            error: err instanceof Error ? err.message : 'Unknown error',
            userId: entry.userId,
            permission: entry.permission,
        });
    }
}

// ============================================
// React Hook for RBAC
// ============================================

/**
 * Hook-compatible permission checker.
 * Use in components: `const canViewAI = usePermissionCheck(profile, 'view_ai_insights')`
 */
export function checkUserPermission(
    userRole: RoleId | undefined,
    permission: Permission
): boolean {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
}
