/**
 * MATIE — Tenant Data Isolation Layer
 * 
 * Validates and enforces tenant-scoped data access across the platform.
 * All Firestore queries that access tenant data MUST be validated through
 * this module to prevent cross-tenant data leakage.
 * 
 * Patent-relevant: Implements multi-tenant data isolation with
 * runtime validation and breach detection.
 */

import { logger } from './logger';
import type { RoleId } from '../types';

// ============================================
// Tenant Validation
// ============================================

/**
 * Validate that a tenant ID is well-formed and not empty.
 */
export function validateTenantId(tenantId: unknown): tenantId is string {
    if (!tenantId || typeof tenantId !== 'string') return false;
    if (tenantId.length < 5 || tenantId.length > 128) return false;
    // Must be alphanumeric with hyphens/underscores (Firestore document ID format)
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) return false;
    return true;
}

/**
 * Assert a tenant ID is valid — throws if not.
 */
export function assertTenantId(tenantId: unknown, context: string = 'unknown'): asserts tenantId is string {
    if (!validateTenantId(tenantId)) {
        logger.error('Invalid tenant ID detected', {
            context,
            tenantIdType: typeof tenantId,
            tenantIdPreview: typeof tenantId === 'string' ? tenantId.substring(0, 20) : 'non-string',
        });
        throw new Error(`Invalid tenant ID in context: ${context}`);
    }
}

// ============================================
// Cross-Tenant Access Detection
// ============================================

/**
 * Verify that a data document belongs to the expected tenant.
 * Returns false and logs a security warning if cross-tenant access is detected.
 */
export function verifyTenantOwnership(
    documentTenantId: string,
    userTenantId: string,
    context: string,
    userId?: string
): boolean {
    if (documentTenantId === userTenantId) return true;

    // SECURITY: Cross-tenant access attempt detected
    logger.error('SECURITY: Cross-tenant data access attempted', {
        documentTenantId,
        userTenantId,
        userId: userId || 'unknown',
        context,
        severity: 'CRITICAL',
    });

    return false;
}

/**
 * Filter an array of documents to only include those belonging to the specified tenant.
 * Logs a warning if any cross-tenant documents are detected.
 */
export function filterByTenant<T extends { tenant_id?: string }>(
    documents: T[],
    tenantId: string,
    context: string
): T[] {
    const filtered = documents.filter(doc => doc.tenant_id === tenantId);

    const removed = documents.length - filtered.length;
    if (removed > 0) {
        logger.warn('Cross-tenant documents filtered out', {
            tenantId,
            context,
            totalDocuments: documents.length,
            removedCount: removed,
        });
    }

    return filtered;
}

// ============================================
// Query Guards
// ============================================

/**
 * Create a tenant-scoped query configuration.
 * Ensures tenant_id is always included in Firestore queries.
 */
export function tenantQueryGuard(
    userTenantId: string,
    userRole: RoleId,
    requestedTenantId?: string
): { tenantId: string; isCrossTenant: boolean } {
    // Platform admins can access any tenant
    if (userRole === 'platform_admin' && requestedTenantId) {
        return {
            tenantId: requestedTenantId,
            isCrossTenant: requestedTenantId !== userTenantId,
        };
    }

    // All other roles are locked to their own tenant
    if (requestedTenantId && requestedTenantId !== userTenantId) {
        logger.warn('Non-admin attempted cross-tenant query', {
            userRole,
            userTenantId,
            requestedTenantId,
        });
        // Silently redirect to user's own tenant
        return { tenantId: userTenantId, isCrossTenant: false };
    }

    return { tenantId: userTenantId, isCrossTenant: false };
}

// ============================================
// Data Sanitization for Tenant Boundaries
// ============================================

/**
 * Redact sensitive fields from tenant data before cross-boundary exposure.
 * Removes API keys, internal notes, and PII.
 */
export function redactSensitiveFields<T extends Record<string, unknown>>(
    data: T,
    sensitiveKeys: string[] = ['api_key', 'secret', 'token', 'password', 'ssn', 'credit_card']
): T {
    const redacted = { ...data };

    for (const key of Object.keys(redacted)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            (redacted as Record<string, unknown>)[key] = '[REDACTED]';
        }
    }

    return redacted;
}

/**
 * Validate that a write operation includes the correct tenant_id.
 * Prevents writes that don't specify a tenant or specify the wrong tenant.
 */
export function validateTenantWrite(
    data: Record<string, unknown>,
    expectedTenantId: string,
    context: string
): boolean {
    if (!data.tenant_id) {
        logger.error('Write operation missing tenant_id', {
            context,
            expectedTenantId,
        });
        return false;
    }

    if (data.tenant_id !== expectedTenantId) {
        logger.error('SECURITY: Write operation tenant_id mismatch', {
            context,
            expectedTenantId,
            actualTenantId: data.tenant_id,
            severity: 'CRITICAL',
        });
        return false;
    }

    return true;
}
