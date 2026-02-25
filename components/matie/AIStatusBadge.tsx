import React from 'react';
import { Activity, AlertTriangle, CloudOff, Loader2, ZapOff } from 'lucide-react';

export type AIStatusState = 'OPERATIONAL' | 'DEGRADED' | 'RATE_LIMITED' | 'FALLBACK_ACTIVE' | 'OFFLINE';

interface AIStatusBadgeProps {
    p95LatencyMs: number;
    fallbackActive: boolean;
    rateLimitExceeded: boolean;
    workerQueueDown: boolean;
}

/**
 * AIStatusBadge: Engine RPM Meter computed deterministically based on thresholds:
 * - OPERATIONAL: P95 < 800ms & no fallback
 * - DEGRADED: P95 > 2s OR fallback active
 * - RATE_LIMITED: 429 rate exceeded
 * - FALLBACK_ACTIVE: Gemini unreachable
 * - OFFLINE: Worker queue down
 */
export const AIStatusBadge: React.FC<AIStatusBadgeProps> = ({
    p95LatencyMs,
    fallbackActive,
    rateLimitExceeded,
    workerQueueDown
}) => {
    // Deterministic state computation
    let state: AIStatusState = 'OPERATIONAL';
    if (workerQueueDown) {
        state = 'OFFLINE';
    } else if (rateLimitExceeded) {
        state = 'RATE_LIMITED';
    } else if (fallbackActive) {
        state = 'FALLBACK_ACTIVE';
    } else if (p95LatencyMs > 2000) {
        state = 'DEGRADED';
    }

    // Visual mapping
    const config: Record<AIStatusState, { label: string; bg: string; text: string; border: string; icon: React.ReactNode; pulse: boolean }> = {
        OPERATIONAL: {
            label: 'AI Operational',
            bg: 'bg-status-operational/10',
            text: 'text-status-operational',
            border: 'border-status-operational/30',
            icon: <Activity className="w-3 h-3 mr-1.5" />,
            pulse: true
        },
        DEGRADED: {
            label: 'AI Degraded',
            bg: 'bg-status-warning/10',
            text: 'text-status-warning',
            border: 'border-status-warning/30',
            icon: <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />,
            pulse: false
        },
        RATE_LIMITED: {
            label: 'Rate Limited',
            bg: 'bg-status-degraded/10',
            text: 'text-status-degraded',
            border: 'border-status-degraded/30',
            icon: <ZapOff className="w-3 h-3 mr-1.5" />,
            pulse: true
        },
        FALLBACK_ACTIVE: {
            label: 'Fallback Active',
            bg: 'bg-status-info/10',
            text: 'text-status-info',
            border: 'border-status-info/30',
            icon: <AlertTriangle className="w-3 h-3 mr-1.5" />,
            pulse: false
        },
        OFFLINE: {
            label: 'Offline',
            bg: 'bg-status-critical/10',
            text: 'text-status-critical',
            border: 'border-status-critical/30',
            icon: <CloudOff className="w-3 h-3 mr-1.5" />,
            pulse: false
        }
    };

    const current = config[state];

    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide border transition-all duration-standard ${current.bg} ${current.text} ${current.border}`}>
            {current.pulse && (
                <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.bg.replace('/10', '')}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${current.bg.replace('/10', '')}`}></span>
                </span>
            )}
            {!current.pulse && current.icon}
            {current.label}
            <span className="ml-2 pl-2 border-l border-current/20 opacity-80">
                Lat: {p95LatencyMs}ms
            </span>
        </div>
    );
};
