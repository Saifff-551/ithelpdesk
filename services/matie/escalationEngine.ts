/**
 * MATIE — Escalation Prediction Engine (Production-Hardened)
 * 
 * Multi-signal escalation prevention system combining:
 * - Gemini NLP sentiment analysis with confidence scoring
 * - Historical pattern detection from ticket data
 * - Trend-based escalation modeling (7-day rolling)
 * - Sigmoid probability normalization
 * - Immutable audit log for every prediction
 * 
 * Patent-relevant: Implements early intervention triggers, auto-priority
 * reassignment, and trend-aware risk assessment via multi-signal fusion.
 */

import { GoogleGenAI } from '@google/genai';
import type { Ticket, TicketPriority } from '../../types';
import type {
    SentimentAnalysis,
    EscalationPrediction,
    ResolutionHistory,
    TenantAIConfig,
    TrendSignal,
    EscalationAuditEntry,
} from './types';
import { truncateForAI, detectPromptInjection, getCircuitBreaker } from '../security';
import { logger } from '../logger';
import { logEscalationPrediction } from './aiAuditLog';

// Gemini AI instance for NLP processing
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// Circuit breaker for Gemini API
const geminiBreaker = getCircuitBreaker('gemini-sentiment', 5, 30_000);

// Analysis cache — avoid re-analyzing same content within 5 minutes
const sentimentCache = new Map<string, { result: SentimentAnalysis; confidence: number; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Engine version for traceability
export const ESCALATION_ENGINE_VERSION = '2.0.0-production';

// ============================================
// Sentiment Analysis (NLP Layer)
// ============================================

/** Critical/escalation trigger keywords */
const ESCALATION_KEYWORDS = [
    'urgent', 'immediately', 'unacceptable', 'escalate', 'manager',
    'lawyer', 'legal', 'sue', 'complaint', 'terrible', 'disaster',
    'broken', 'outage', 'down', 'critical', 'emergency', 'furious',
    'incompetent', 'worst', 'refund', 'cancel', 'deadline', 'lost data',
];

/**
 * Analyze sentiment of ticket content using Gemini NLP.
 * Returns both sentiment analysis AND NLP confidence score.
 * Falls back to keyword-based heuristic if API is unavailable.
 */
export async function analyzeSentiment(
    subject: string,
    description: string
): Promise<{ sentiment: SentimentAnalysis; confidence: number }> {
    // SECURITY: Sanitize inputs before processing
    const safeSubject = truncateForAI(subject, 500);
    const safeDescription = truncateForAI(description, 1500);
    const fullText = `${safeSubject} ${safeDescription}`.toLowerCase();

    // Check cache first
    const cacheKey = fullText.substring(0, 200);
    const cached = sentimentCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        logger.debug('Sentiment cache hit', { cacheKey: cacheKey.substring(0, 50) });
        return { sentiment: cached.result, confidence: cached.confidence };
    }

    // Check for prompt injection
    if (detectPromptInjection(subject) || detectPromptInjection(description)) {
        logger.warn('Prompt injection detected in ticket content', { subject: safeSubject.substring(0, 100) });
        return { sentiment: heuristicSentiment(fullText), confidence: 0 };
    }

    // Check circuit breaker
    if (!geminiBreaker.canExecute()) {
        logger.warn('Gemini circuit breaker OPEN — using heuristic fallback');
        return { sentiment: heuristicSentiment(fullText), confidence: 0 };
    }

    try {
        const prompt = `
      Analyze the sentiment of this IT helpdesk ticket. Return ONLY a JSON object:
      {
        "score": <number from -1.0 (very negative) to 1.0 (very positive)>,
        "magnitude": <number from 0.0 (calm) to 1.0 (very emotional)>,
        "label": "positive" | "neutral" | "negative" | "critical",
        "confidence": <number from 0.0 to 1.0, how confident you are in this analysis>
      }

      Ticket Subject: ${safeSubject}
      Ticket Description: ${safeDescription}
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text || '';
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const parsed = JSON.parse(jsonStr);

        // Validate parsed response structure
        const validLabels = ['positive', 'neutral', 'negative', 'critical'];
        const label = validLabels.includes(parsed.label) ? parsed.label : 'neutral';

        // Detect trigger keywords
        const keywords = ESCALATION_KEYWORDS.filter(kw => fullText.includes(kw));

        // Extract Gemini confidence
        const nlpConfidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7));

        const result: SentimentAnalysis = {
            score: Math.min(1, Math.max(-1, Number(parsed.score) || 0)),
            magnitude: Math.min(1, Math.max(0, Number(parsed.magnitude) || 0.5)),
            label,
            keywords,
        };

        geminiBreaker.recordSuccess();

        // Cache the result with confidence
        sentimentCache.set(cacheKey, { result, confidence: nlpConfidence, expiresAt: Date.now() + CACHE_TTL_MS });

        logger.info('Sentiment analysis completed via Gemini', {
            label: result.label,
            score: result.score.toFixed(2),
            confidence: nlpConfidence.toFixed(2),
        });

        return { sentiment: result, confidence: nlpConfidence };
    } catch (err) {
        geminiBreaker.recordFailure();
        logger.error('Gemini sentiment analysis failed — falling back to heuristic', {
            error: err instanceof Error ? err.message : 'Unknown error',
            circuitState: geminiBreaker.getState(),
        });
        return { sentiment: heuristicSentiment(fullText), confidence: 0 };
    }
}

/**
 * Keyword-based fallback sentiment analysis.
 * Used when Gemini API is unavailable.
 */
function heuristicSentiment(text: string): SentimentAnalysis {
    const matchedKeywords = ESCALATION_KEYWORDS.filter(kw => text.includes(kw));
    const negativeCount = matchedKeywords.length;

    let score: number;
    let label: SentimentAnalysis['label'];

    if (negativeCount >= 4) {
        score = -0.9;
        label = 'critical';
    } else if (negativeCount >= 2) {
        score = -0.5;
        label = 'negative';
    } else if (negativeCount === 1) {
        score = -0.2;
        label = 'negative';
    } else {
        score = 0.2;
        label = 'neutral';
    }

    return {
        score,
        magnitude: Math.min(1, negativeCount * 0.25),
        label,
        keywords: matchedKeywords,
    };
}

// ============================================
// Historical Pattern Detection
// ============================================

/**
 * Build resolution history from existing tickets.
 * Analyzes temporal patterns, SLA compliance, and repeat behavior.
 */
export function buildResolutionHistory(
    tickets: Ticket[],
    creatorId?: string
): ResolutionHistory {
    const resolved = tickets.filter(t =>
        t.status === 'resolved' || t.status === 'closed'
    );

    const resolutionTimes = resolved
        .filter(t => t.updated_at && t.created_at)
        .map(t => {
            const created = new Date(t.created_at).getTime();
            const updated = new Date(t.updated_at).getTime();
            return Math.max(0, (updated - created) / (1000 * 60 * 60)); // hours
        });

    const sorted = [...resolutionTimes].sort((a, b) => a - b);
    const avg = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 24;
    const median = sorted.length > 0
        ? sorted[Math.floor(sorted.length / 2)]
        : 24;

    // SLA breach rate
    const totalRelevant = tickets.filter(t => t.status !== 'closed').length;
    const breached = tickets.filter(t =>
        t.sla_deadline && new Date(t.sla_deadline).getTime() < Date.now() && t.status !== 'resolved' && t.status !== 'closed'
    ).length;

    // Repeat complaint rate for this creator
    let repeatRate = 0;
    if (creatorId) {
        const creatorTickets = tickets.filter(t => t.creator_id === creatorId);
        repeatRate = creatorTickets.length > 1 ? Math.min(1, (creatorTickets.length - 1) / 10) : 0;
    }

    // Category resolution rates
    const categoryTimes: Record<string, number[]> = {};
    resolved.forEach(t => {
        const cat = t.category;
        if (!categoryTimes[cat]) categoryTimes[cat] = [];
        const created = new Date(t.created_at).getTime();
        const updated = new Date(t.updated_at).getTime();
        categoryTimes[cat].push(Math.max(0, (updated - created) / (1000 * 60 * 60)));
    });

    const categoryResolutionRate: Record<string, number> = {};
    Object.entries(categoryTimes).forEach(([cat, times]) => {
        categoryResolutionRate[cat] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    return {
        avgResolutionHours: avg,
        medianResolutionHours: median,
        slaBreachRate: totalRelevant > 0 ? breached / totalRelevant : 0,
        repeatComplaintRate: repeatRate,
        categoryResolutionRate,
    };
}

// ============================================
// Trend-Based Escalation Modeling
// ============================================

/**
 * Detect historical trend signals from ticket data.
 * Analyzes 7-day rolling patterns for volume, category, and priority trends.
 * 
 * Patent-relevant: Multi-signal trend fusion for predictive analysis.
 */
function detectTrendSignals(
    ticket: Ticket,
    allTickets: Ticket[]
): TrendSignal[] {
    const signals: TrendSignal[] = [];
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // --- Signal 1: Volume Spike Detection ---
    const last7Days = allTickets.filter(t =>
        new Date(t.created_at).getTime() > now - 7 * DAY_MS
    ).length;
    const prev7Days = allTickets.filter(t => {
        const ts = new Date(t.created_at).getTime();
        return ts > now - 14 * DAY_MS && ts <= now - 7 * DAY_MS;
    }).length;

    const volumeChange = prev7Days > 0 ? (last7Days - prev7Days) / prev7Days : 0;
    if (Math.abs(volumeChange) > 0.2) {
        signals.push({
            signal: 'volume_trend',
            direction: volumeChange > 0 ? 'rising' : 'falling',
            strength: Math.min(1, Math.abs(volumeChange)),
            description: `Ticket volume ${volumeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeChange * 100).toFixed(0)}% vs. previous week`,
        });
    }

    // --- Signal 2: Category Hotspot ---
    const categorySame = allTickets.filter(t =>
        t.category === ticket.category &&
        new Date(t.created_at).getTime() > now - 7 * DAY_MS
    ).length;
    const categoryPrev = allTickets.filter(t =>
        t.category === ticket.category &&
        new Date(t.created_at).getTime() > now - 14 * DAY_MS &&
        new Date(t.created_at).getTime() <= now - 7 * DAY_MS
    ).length;

    const categoryGrowth = categoryPrev > 0 ? (categorySame - categoryPrev) / categoryPrev : 0;
    if (categoryGrowth > 0.3) {
        signals.push({
            signal: 'category_hotspot',
            direction: 'rising',
            strength: Math.min(1, categoryGrowth),
            description: `[${ticket.category}] tickets spiked ${(categoryGrowth * 100).toFixed(0)}% — possible systemic issue`,
        });
    }

    // --- Signal 3: Repeat Creator Pattern ---
    const creatorRecent = allTickets.filter(t =>
        t.creator_id === ticket.creator_id &&
        new Date(t.created_at).getTime() > now - 7 * DAY_MS
    ).length;
    if (creatorRecent >= 3) {
        signals.push({
            signal: 'repeat_creator',
            direction: 'rising',
            strength: Math.min(1, creatorRecent / 5),
            description: `Creator filed ${creatorRecent} tickets in last 7 days — persistent issue`,
        });
    }

    // --- Signal 4: Priority Escalation Trend ---
    const recentUrgent = allTickets.filter(t =>
        (t.priority === 'urgent' || t.priority === 'high') &&
        new Date(t.created_at).getTime() > now - 7 * DAY_MS
    ).length;
    const prevUrgent = allTickets.filter(t =>
        (t.priority === 'urgent' || t.priority === 'high') &&
        new Date(t.created_at).getTime() > now - 14 * DAY_MS &&
        new Date(t.created_at).getTime() <= now - 7 * DAY_MS
    ).length;

    if (recentUrgent > prevUrgent + 2) {
        signals.push({
            signal: 'priority_escalation_trend',
            direction: 'rising',
            strength: Math.min(1, (recentUrgent - prevUrgent) / Math.max(1, prevUrgent)),
            description: `High/urgent tickets rose from ${prevUrgent} to ${recentUrgent} — escalation wave`,
        });
    }

    // --- Signal 5: SLA Breach Acceleration ---
    const recentBreaches = allTickets.filter(t =>
        t.sla_deadline &&
        new Date(t.sla_deadline).getTime() < now &&
        t.status !== 'resolved' && t.status !== 'closed' &&
        new Date(t.created_at).getTime() > now - 7 * DAY_MS
    ).length;
    if (recentBreaches > 2) {
        signals.push({
            signal: 'sla_breach_acceleration',
            direction: 'rising',
            strength: Math.min(1, recentBreaches / 5),
            description: `${recentBreaches} active SLA breaches in last 7 days`,
        });
    }

    return signals;
}

// ============================================
// Sigmoid Probability Normalization
// ============================================

/**
 * Sigmoid normalization for escalation probability.
 * Maps raw signal sum to smooth 0-1 probability with natural saturation.
 * 
 * sigmoid(x) = 1 / (1 + e^(-k*(x - midpoint)))
 * k=8 provides sharp transition around midpoint
 */
function sigmoidNormalize(rawScore: number, midpoint: number = 0.45, steepness: number = 8): number {
    return 1 / (1 + Math.exp(-steepness * (rawScore - midpoint)));
}

// ============================================
// Escalation Prediction Model
// ============================================

/**
 * Predict escalation probability for a ticket.
 * 
 * Combines multiple signals via sigmoid-normalized probability fusion:
 * - Gemini NLP sentiment with confidence weighting
 * - Historical resolution patterns
 * - 7-day trend-based escalation modeling
 * - Repeat complaint detection
 * - SLA breach proximity
 * - Agent response delay patterns
 * 
 * Every prediction is persisted to the immutable audit trail.
 */
export async function predictEscalation(
    ticket: Ticket,
    allTickets: Ticket[],
    config?: Partial<TenantAIConfig>,
    tenantId?: string
): Promise<EscalationPrediction> {
    // 1. Run NLP sentiment analysis (returns confidence)
    const { sentiment, confidence: sentimentConfidence } = await analyzeSentiment(
        ticket.subject, ticket.description
    );

    // 2. Build historical context
    const history = buildResolutionHistory(allTickets, ticket.creator_id);

    // 3. Detect trend signals
    const trendSignals = detectTrendSignals(ticket, allTickets);

    // 4. Check for repeat complaints
    const creatorTickets = allTickets.filter(t => t.creator_id === ticket.creator_id);
    const isRepeatComplaint = creatorTickets.length > 1;

    // 5. Compute raw escalation signals (weighted)
    // Weight sentiment risk by Gemini confidence (heuristic fallback gets lower weight)
    const confidenceMultiplier = sentimentConfidence > 0 ? sentimentConfidence : 0.6;
    const sentimentRisk = Math.max(0, (1 - sentiment.score) / 2) * confidenceMultiplier;

    // Aggregate trend signal strength
    const trendRisk = trendSignals.length > 0
        ? trendSignals.reduce((sum, s) => sum + s.strength, 0) / trendSignals.length
        : 0;

    const rawSignals = {
        sentimentRisk: sentimentRisk * 0.25,
        slaBreach: history.slaBreachRate * 0.15,
        repeatComplaint: history.repeatComplaintRate * 0.15,
        priorityRisk: getPriorityRiskFactor(ticket.priority) * 0.15,
        responseDelay: computeResponseDelay(ticket) * 0.15,
        trendRisk: trendRisk * 0.15,
    };

    const rawSum = Object.values(rawSignals).reduce((a, b) => a + b, 0);

    // 6. Sigmoid normalization → smooth 0-1 probability
    const probability = sigmoidNormalize(rawSum, 0.35, 10);

    // 7. Determine risk level
    let riskLevel: EscalationPrediction['riskLevel'];
    if (probability >= 0.8) riskLevel = 'critical';
    else if (probability >= 0.6) riskLevel = 'high';
    else if (probability >= 0.35) riskLevel = 'medium';
    else riskLevel = 'low';

    // 8. Generate trigger factors
    const triggerFactors: string[] = [];
    if (sentiment.label === 'critical' || sentiment.label === 'negative') {
        triggerFactors.push(`Negative sentiment (score: ${sentiment.score.toFixed(2)}, NLP confidence: ${(sentimentConfidence * 100).toFixed(0)}%)`);
    }
    if (sentiment.keywords.length > 0) {
        triggerFactors.push(`Escalation keywords: ${sentiment.keywords.join(', ')}`);
    }
    if (isRepeatComplaint) {
        triggerFactors.push(`Repeat complaint from same user (${creatorTickets.length} tickets)`);
    }
    if (history.slaBreachRate > 0.3) {
        triggerFactors.push(`High SLA breach rate: ${(history.slaBreachRate * 100).toFixed(0)}%`);
    }
    if (ticket.priority === 'urgent' || ticket.priority === 'high') {
        triggerFactors.push(`High-priority ticket: ${ticket.priority}`);
    }
    trendSignals.forEach(ts => {
        if (ts.strength >= 0.3) {
            triggerFactors.push(`Trend: ${ts.description}`);
        }
    });

    // 9. Generate recommended actions
    const recommendedActions: string[] = [];
    if (probability >= 0.6) {
        recommendedActions.push('Assign to senior/experienced agent');
        recommendedActions.push('Send proactive status update to customer');
    }
    if (probability >= 0.8) {
        recommendedActions.push('Notify IT Manager for immediate attention');
        recommendedActions.push('Consider auto-escalating priority');
    }
    if (isRepeatComplaint) {
        recommendedActions.push('Review previous tickets for recurring issue pattern');
    }
    trendSignals.forEach(ts => {
        if (ts.signal === 'category_hotspot' && ts.strength >= 0.5) {
            recommendedActions.push(`Investigate systemic issue in [${ticket.category}]`);
        }
    });
    if (recommendedActions.length === 0) {
        recommendedActions.push('Standard processing — no intervention needed');
    }

    // 10. Suggest priority reassignment if warranted
    const threshold = config?.escalationThreshold || 0.75;
    let suggestedPriority: TicketPriority | undefined;
    if (probability >= threshold && ticket.priority !== 'urgent') {
        const priorityMap: Record<TicketPriority, TicketPriority> = {
            low: 'medium',
            medium: 'high',
            high: 'urgent',
            urgent: 'urgent',
        };
        suggestedPriority = priorityMap[ticket.priority];
    }

    const prediction: EscalationPrediction = {
        ticketId: ticket.id,
        probability: Math.round(probability * 10000) / 10000, // 4 decimal precision
        riskLevel,
        triggerFactors,
        recommendedActions,
        sentiment,
        sentimentConfidence: Math.round(sentimentConfidence * 1000) / 1000,
        isRepeatComplaint,
        predictedResolutionHours: history.categoryResolutionRate[ticket.category] || history.avgResolutionHours,
        shouldAutoEscalate: probability >= threshold,
        suggestedPriority,
        trendSignals,
    };

    // 11. AUDIT: Log every escalation prediction to immutable trail
    if (tenantId) {
        const auditEntry: EscalationAuditEntry = {
            ticketId: ticket.id,
            tenantId,
            timestamp: new Date().toISOString(),
            probability: prediction.probability,
            riskLevel: prediction.riskLevel,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            sentimentConfidence,
            triggerFactors,
            trendSignals,
            isRepeatComplaint,
            modelVersion: ESCALATION_ENGINE_VERSION,
        };
        logEscalationPrediction(auditEntry).catch(() => {
            // Non-blocking — don't fail prediction if audit log fails
        });
    }

    logger.info('Escalation prediction completed', {
        ticketId: ticket.id,
        probability: prediction.probability.toFixed(4),
        riskLevel,
        sentimentConfidence: sentimentConfidence.toFixed(2),
        trendSignalCount: trendSignals.length,
        modelVersion: ESCALATION_ENGINE_VERSION,
    });

    return prediction;
}

// ============================================
// Helper Functions
// ============================================

function getPriorityRiskFactor(priority: TicketPriority): number {
    const factors: Record<TicketPriority, number> = {
        urgent: 0.9,
        high: 0.65,
        medium: 0.35,
        low: 0.1,
    };
    return factors[priority] || 0.35;
}

/**
 * Compute response delay factor (0–1).
 * Higher = longer delay without response = higher escalation risk.
 */
function computeResponseDelay(ticket: Ticket): number {
    if (ticket.first_response_at) return 0; // Already responded
    if (ticket.status === 'resolved' || ticket.status === 'closed') return 0;

    const created = new Date(ticket.created_at).getTime();
    const now = Date.now();
    const hoursWaiting = (now - created) / (1000 * 60 * 60);

    // Exponential decay — risk rises sharply after 4 hours
    return Math.min(1, Math.pow(hoursWaiting / 8, 1.5));
}
