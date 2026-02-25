import React from 'react';
import { Shield } from 'lucide-react';
import { useTenant } from '../../services/TenantContext';

export const TenantContextBanner: React.FC = () => {
    const { tenant } = useTenant();

    if (!tenant) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div className="bg-surface-1 border border-border-strong rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-card backdrop-blur-sm opacity-80">
                <Shield className="w-3.5 h-3.5 text-status-info" />
                <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">
                    Tenant Boundary: <strong className="text-gray-200">{tenant.subdomain}</strong>
                </span>
            </div>
        </div>
    );
};
