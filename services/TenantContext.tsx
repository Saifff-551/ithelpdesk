/**
 * Tenant Context Provider
 * 
 * Provides tenant information to the entire application.
 * Resolves tenant on app load (before auth) and applies branding.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { resolveTenant, clearTenantCache, isPlatformDomain } from './tenantResolver';
import type { Tenant } from '../types';

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
    isPublicAccess: boolean;  // true when on main platform domain (no tenant)
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Apply tenant branding to the document
 */
const applyBranding = (tenant: Tenant | null): void => {
    const root = document.documentElement;

    if (tenant) {
        // Apply tenant colors
        root.style.setProperty('--primary-color', tenant.primary_color);
        root.style.setProperty('--secondary-color', tenant.secondary_color);
        if (tenant.accent_color) {
            root.style.setProperty('--accent-color', tenant.accent_color);
        }

        // Update document title
        document.title = `${tenant.name} Control Plane`;

        // Update favicon if custom
        if (tenant.favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = tenant.favicon_url;
        }

        // Update meta theme color
        let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.content = tenant.primary_color;
    } else {
        // Reset to platform defaults
        root.style.setProperty('--primary-color', '#9213ec');
        root.style.setProperty('--secondary-color', '#7a10c4');
        root.style.setProperty('--accent-color', '#6366f1');
        document.title = 'MATIE - Enterprise AI Infrastructure';
    }
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPublicAccess, setIsPublicAccess] = useState(false);

    const loadTenant = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Check if we're on platform domain first
            if (isPlatformDomain()) {
                setIsPublicAccess(true);
                setTenant(null);
                applyBranding(null);
                return;
            }

            // Resolve tenant from URL
            const resolvedTenant = await resolveTenant();

            if (resolvedTenant) {
                setTenant(resolvedTenant);
                setIsPublicAccess(false);
                applyBranding(resolvedTenant);
            } else {
                // No tenant found for this domain - could be invalid subdomain
                setTenant(null);
                setIsPublicAccess(true);
                applyBranding(null);
                // Don't set error - just show platform view
            }
        } catch (err) {
            console.error('Error resolving tenant:', err);
            setError('Failed to load organization');
            setIsPublicAccess(true);
            applyBranding(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Resolve tenant on mount
    useEffect(() => {
        loadTenant();
    }, [loadTenant]);

    const refreshTenant = async () => {
        clearTenantCache();
        await loadTenant();
    };

    return (
        <TenantContext.Provider value={{ tenant, loading, error, isPublicAccess, refreshTenant }}>
            {children}
        </TenantContext.Provider>
    );
};

/**
 * Hook to access tenant context
 */
export const useTenant = (): TenantContextType => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

/**
 * Hook to get current tenant or throw if not in tenant context
 */
export const useRequiredTenant = (): Tenant => {
    const { tenant } = useTenant();
    if (!tenant) {
        throw new Error('This component requires a tenant context');
    }
    return tenant;
};
