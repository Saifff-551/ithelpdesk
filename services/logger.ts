/**
 * MATIE — Structured Logger
 * 
 * Production-grade logging with severity levels, tenant context,
 * and performance timing. Replaces all console.log/error calls
 * with structured, filterable log entries.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    tenantId?: string;
    userId?: string;
}

// Minimum log level (can be set via env var)
const MIN_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'INFO';

const LEVEL_ORDER: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
    };
}

function formatEntry(entry: LogEntry): string {
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const tenant = entry.tenantId ? ` [tenant:${entry.tenantId}]` : '';
    return `[${entry.timestamp}] [${entry.level}]${tenant} ${entry.message}${ctx}`;
}

/**
 * Structured logger with tenant context support.
 */
export const logger = {
    debug(message: string, context?: Record<string, unknown>) {
        if (!shouldLog('DEBUG')) return;
        const entry = createEntry('DEBUG', message, context);
        console.debug(formatEntry(entry));
    },

    info(message: string, context?: Record<string, unknown>) {
        if (!shouldLog('INFO')) return;
        const entry = createEntry('INFO', message, context);
        console.info(formatEntry(entry));
    },

    warn(message: string, context?: Record<string, unknown>) {
        if (!shouldLog('WARN')) return;
        const entry = createEntry('WARN', message, context);
        console.warn(formatEntry(entry));
    },

    error(message: string, context?: Record<string, unknown>) {
        if (!shouldLog('ERROR')) return;
        const entry = createEntry('ERROR', message, context);
        console.error(formatEntry(entry));
    },

    /**
     * Create a tenant-scoped child logger.
     */
    withTenant(tenantId: string) {
        return {
            debug: (msg: string, ctx?: Record<string, unknown>) =>
                logger.debug(msg, { ...ctx, tenantId }),
            info: (msg: string, ctx?: Record<string, unknown>) =>
                logger.info(msg, { ...ctx, tenantId }),
            warn: (msg: string, ctx?: Record<string, unknown>) =>
                logger.warn(msg, { ...ctx, tenantId }),
            error: (msg: string, ctx?: Record<string, unknown>) =>
                logger.error(msg, { ...ctx, tenantId }),
        };
    },

    /**
     * Time an async operation and log the result.
     */
    async time<T>(
        label: string,
        fn: () => Promise<T>,
        context?: Record<string, unknown>
    ): Promise<T> {
        const start = performance.now();
        try {
            const result = await fn();
            const duration = Math.round(performance.now() - start);
            logger.info(`${label} completed`, { ...context, durationMs: duration });
            return result;
        } catch (err) {
            const duration = Math.round(performance.now() - start);
            logger.error(`${label} failed`, {
                ...context,
                durationMs: duration,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
            throw err;
        }
    },
};
