import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DegradedStateBannerProps {
    fallbackActive: boolean;
}

export const DegradedStateBanner: React.FC<DegradedStateBannerProps> = ({ fallbackActive }) => {
    if (!fallbackActive) return null;
    return (
        <div className="w-full bg-status-warning/10 border-b border-status-warning/30 p-3 flex items-center justify-center space-x-2 animate-in slide-in-from-top-2 duration-standard">
            <AlertTriangle className="text-status-warning h-4 w-4" />
            <span className="text-status-warning text-sm font-sans tracking-wide">
                <strong>Degraded Mode:</strong> Primary LLM routing delayed. Falling back to rule-based synchronous queue. AI confidence metrics are temporarily disabled.
            </span>
        </div>
    );
};
