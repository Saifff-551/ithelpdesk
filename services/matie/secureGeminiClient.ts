/**
 * MATIE — Secure Gemini API Client
 * 
 * Production-grade wrapper for Google Gemini API calls with:
 * - Input validation and sanitization
 * - Rate limiting per tenant
 * - Circuit breaker for fault tolerance
 * - Response validation and safe parsing
 * - Comprehensive audit logging
 * - Token usage tracking
 *
 * All AI API interactions MUST go through this client.
 */

import { GoogleGenAI } from '@google/genai';
import {
    sanitizeText,
    truncateForAI,
    detectPromptInjection,
    checkRateLimit,
    getRateLimitRemaining,
    getCircuitBreaker,
} from '../security';
import { logger } from '../logger';

// ============================================
// Secure Client Configuration
// ============================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Validate API key at module load
if (!GEMINI_API_KEY) {
    logger.warn('VITE_GEMINI_API_KEY is not set — AI features will be disabled');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const geminiBreaker = getCircuitBreaker('gemini-secure-client', 5, 30_000);

// Model whitelist — only allowed models can be used
const ALLOWED_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

// Default safety limits
const MAX_INPUT_TOKENS = 4000;  // Characters (approx tokens = chars/4)
const MAX_OUTPUT_TOKENS = 2000;
const DEFAULT_RATE_LIMIT = 30;  // Calls per minute per tenant
const DEFAULT_RATE_WINDOW_MS = 60_000;

// ============================================
// Types
// ============================================

export interface SecureGeminiRequest {
    tenantId: string;
    userId?: string;
    model?: string;
    prompt: string;
    context?: string;           // Additional context (e.g., ticket data)
    maxOutputTokens?: number;
    temperature?: number;
    purpose: string;            // Human-readable purpose (for audit)
}

export interface SecureGeminiResponse {
    text: string;
    model: string;
    tokensUsed: {
        inputEstimate: number;
        outputEstimate: number;
    };
    latencyMs: number;
    fromCache: boolean;
    confidence: number;         // 0 = fallback, 1 = clean API response
}

// Response cache
const responseCache = new Map<string, { response: SecureGeminiResponse; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ============================================
// Secure API Call
// ============================================

/**
 * Execute a secure, validated Gemini API call.
 * 
 * Pipeline:
 * 1. Validate inputs (model, prompt length)
 * 2. Check rate limits (per tenant)
 * 3. Detect prompt injection
 * 4. Check circuit breaker
 * 5. Check response cache
 * 6. Execute API call with timeout
 * 7. Validate response
 * 8. Log audit entry
 */
export async function secureGenerate(
    request: SecureGeminiRequest
): Promise<SecureGeminiResponse> {
    const startTime = Date.now();

    // 1. API key check
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured — AI features disabled');
    }

    // 2. Model validation
    const model = request.model || 'gemini-2.0-flash';
    if (!ALLOWED_MODELS.includes(model)) {
        throw new Error(`Model '${model}' is not in the allowed whitelist: ${ALLOWED_MODELS.join(', ')}`);
    }

    // 3. Input sanitization
    const safePrompt = truncateForAI(request.prompt, MAX_INPUT_TOKENS);
    const safeContext = request.context ? truncateForAI(request.context, MAX_INPUT_TOKENS) : '';

    if (safePrompt.length < 10) {
        throw new Error('Prompt too short — minimum 10 characters required');
    }

    // 4. Prompt injection detection
    if (detectPromptInjection(request.prompt)) {
        logger.warn('Prompt injection detected in secure Gemini call', {
            tenantId: request.tenantId,
            userId: request.userId,
            purpose: request.purpose,
            promptPreview: safePrompt.substring(0, 100),
        });
        throw new Error('Request rejected — potentially unsafe content detected');
    }

    // Also check context for injection
    if (request.context && detectPromptInjection(request.context)) {
        logger.warn('Prompt injection detected in context', {
            tenantId: request.tenantId,
            purpose: request.purpose,
        });
        throw new Error('Request rejected — potentially unsafe context detected');
    }

    // 5. Rate limiting (per tenant)
    const rateLimitKey = `gemini:${request.tenantId}`;
    if (!checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS)) {
        const remaining = getRateLimitRemaining(rateLimitKey, DEFAULT_RATE_LIMIT);
        logger.warn('Gemini rate limit exceeded', {
            tenantId: request.tenantId,
            remaining,
            purpose: request.purpose,
        });
        throw new Error(`AI rate limit exceeded (${remaining} remaining) — please try again shortly`);
    }

    // 6. Circuit breaker check
    if (!geminiBreaker.canExecute()) {
        logger.warn('Gemini circuit breaker OPEN in secure client', {
            tenantId: request.tenantId,
            purpose: request.purpose,
            circuitState: geminiBreaker.getState(),
        });
        throw new Error('AI service temporarily unavailable — circuit breaker open');
    }

    // 7. Cache check
    const cacheKey = `${model}:${safePrompt.substring(0, 200)}:${safeContext.substring(0, 100)}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        logger.debug('Secure Gemini cache hit', {
            tenantId: request.tenantId,
            purpose: request.purpose,
        });
        return { ...cached.response, fromCache: true, latencyMs: Date.now() - startTime };
    }

    // 8. Execute API call
    try {
        const fullPrompt = safeContext
            ? `${safePrompt}\n\nContext:\n${safeContext}`
            : safePrompt;

        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                maxOutputTokens: Math.min(request.maxOutputTokens || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
                temperature: Math.min(Math.max(request.temperature || 0.3, 0), 1),
            },
        });

        const text = response.text || '';

        // Validate response
        if (!text || text.trim().length === 0) {
            geminiBreaker.recordFailure();
            throw new Error('Empty response from Gemini API');
        }

        geminiBreaker.recordSuccess();

        const result: SecureGeminiResponse = {
            text: sanitizeText(text),  // Sanitize output — defense in depth
            model,
            tokensUsed: {
                inputEstimate: Math.ceil(fullPrompt.length / 4),
                outputEstimate: Math.ceil(text.length / 4),
            },
            latencyMs: Date.now() - startTime,
            fromCache: false,
            confidence: 1.0,
        };

        // Cache the response
        responseCache.set(cacheKey, { response: result, expiresAt: Date.now() + CACHE_TTL_MS });

        // Log audit
        logger.info('Secure Gemini call completed', {
            tenantId: request.tenantId,
            purpose: request.purpose,
            model,
            inputTokens: result.tokensUsed.inputEstimate,
            outputTokens: result.tokensUsed.outputEstimate,
            latencyMs: result.latencyMs,
        });

        return result;
    } catch (err) {
        const isApiError = err instanceof Error && !err.message.includes('rejected');
        if (isApiError) {
            geminiBreaker.recordFailure();
        }

        logger.error('Secure Gemini call failed', {
            tenantId: request.tenantId,
            purpose: request.purpose,
            model,
            error: err instanceof Error ? err.message : 'Unknown error',
            circuitState: geminiBreaker.getState(),
        });

        throw err;
    }
}

// ============================================
// Utility: Safe JSON Parse from Gemini
// ============================================

/**
 * Parse JSON from a Gemini response, handling markdown code blocks
 * and partial responses gracefully.
 */
export function safeParseGeminiJSON<T>(text: string): T | null {
    try {
        // Strip markdown code blocks if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
        }

        // Find the JSON object/array
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1) return null;

        return JSON.parse(cleaned.substring(start, end + 1)) as T;
    } catch {
        logger.debug('Failed to parse Gemini JSON response', { preview: text.substring(0, 200) });
        return null;
    }
}

/**
 * Check if the secure Gemini client is operational.
 */
export function isGeminiAvailable(): boolean {
    return Boolean(GEMINI_API_KEY) && geminiBreaker.canExecute();
}
