/**
 * MATIE — Security Utilities
 * 
 * Input sanitization, rate limiting, and content safety for the
 * enterprise AI platform. Prevents prompt injection, XSS, and
 * API abuse.
 */

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize raw text input — strips HTML tags, script content,
 * and control characters. Safe for NLP processing.
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script content (even without tags)
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        // Remove control characters except newlines
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Collapse excessive whitespace
        .replace(/\s{3,}/g, '  ')
        .trim();
}

/**
 * Truncate text to a safe length for LLM processing.
 * Prevents excessive token usage and prompt injection via long inputs.
 */
export function truncateForAI(input: string, maxLength: number = 2000): string {
    const sanitized = sanitizeText(input);
    if (sanitized.length <= maxLength) return sanitized;
    return sanitized.substring(0, maxLength) + '… [truncated]';
}

/**
 * Guard against prompt injection patterns.
 * Returns true if the input contains suspicious injection patterns.
 */
export function detectPromptInjection(input: string): boolean {
    const patterns = [
        /ignore\s+(all\s+)?previous\s+instructions/i,
        /you\s+are\s+now\s+/i,
        /system\s*:\s*/i,
        /\bpretend\b.*\byou\s+are\b/i,
        /\bforget\b.*\binstructions\b/i,
        /\bact\s+as\b.*\b(admin|root|system)\b/i,
        /\boverride\b.*\b(rules|policy|prompt)\b/i,
    ];
    return patterns.some(p => p.test(input));
}

// ============================================
// Rate Limiting (Client-Side)
// ============================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiter for AI API calls.
 * Enforces per-tenant request throttling.
 * 
 * @param key      Unique key (e.g., `tenant_id:api_name`)
 * @param maxCalls Maximum calls allowed in the window
 * @param windowMs Time window in milliseconds (default: 60s)
 * @returns        true if request is allowed, false if rate limited
 */
export function checkRateLimit(
    key: string,
    maxCalls: number = 30,
    windowMs: number = 60_000
): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= maxCalls) {
        return false; // Rate limited
    }

    entry.count++;
    return true;
}

/**
 * Get remaining rate limit quota for a key.
 */
export function getRateLimitRemaining(
    key: string,
    maxCalls: number = 30
): number {
    const entry = rateLimitStore.get(key);
    if (!entry || Date.now() >= entry.resetAt) return maxCalls;
    return Math.max(0, maxCalls - entry.count);
}

// ============================================
// Circuit Breaker for External APIs
// ============================================

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    lastFailure: number;
    nextAttempt: number;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * Circuit breaker for external API calls (Gemini).
 * 
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests blocked for cooldown period
 * - HALF-OPEN: After cooldown, allows one test request
 */
export function getCircuitBreaker(
    serviceName: string,
    failureThreshold: number = 5,
    cooldownMs: number = 30_000
): {
    canExecute: () => boolean;
    recordSuccess: () => void;
    recordFailure: () => void;
    getState: () => CircuitState;
} {
    if (!circuitBreakers.has(serviceName)) {
        circuitBreakers.set(serviceName, {
            state: 'closed',
            failures: 0,
            lastFailure: 0,
            nextAttempt: 0,
        });
    }

    const cb = circuitBreakers.get(serviceName)!;

    return {
        canExecute: () => {
            const now = Date.now();
            if (cb.state === 'closed') return true;
            if (cb.state === 'open' && now >= cb.nextAttempt) {
                cb.state = 'half-open';
                return true;
            }
            if (cb.state === 'half-open') return true;
            return false;
        },

        recordSuccess: () => {
            cb.state = 'closed';
            cb.failures = 0;
        },

        recordFailure: () => {
            cb.failures++;
            cb.lastFailure = Date.now();
            if (cb.failures >= failureThreshold) {
                cb.state = 'open';
                cb.nextAttempt = Date.now() + cooldownMs;
            }
        },

        getState: () => cb.state,
    };
}
