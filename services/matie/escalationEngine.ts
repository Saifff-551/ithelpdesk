/**
 * MATIE — Escalation Prediction Engine
 * 
 * Proactive escalation prevention system using NLP sentiment analysis,
 * historical resolution patterns, repeated complaint detection, and
 * predictive probability modeling.
 * 
 * Patent-relevant: This engine implements early intervention triggers
 * and auto-priority reassignment based on multi-signal risk assessment.
 */

import { GoogleGenAI } from '@google/genai';
import type { Ticket, Profile, TicketPriority } from '../../types';
import type {
    SentimentAnalysis,
    EscalationPrediction,
    ResolutionHistory,
    TenantAIConfig,
} from './types';

// Gemini AI instance for NLP processing
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

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
 * Falls back to keyword-based heuristic if API is unavailable.
 */
export async function analyzeSentiment(
    subject: string,
    description: string
): Promise<SentimentAnalysis> {
    const fullText = `${subject} ${description}`.toLowerCase();

    try {
        const prompt = `
      Analyze the sentiment of this IT helpdesk ticket. Return ONLY a JSON object:
      {
        "score": <number from -1.0 (very negative) to 1.0 (very positive)>,
        "magnitude": <number from 0.0 (calm) to 1.0 (very emotional)>,
        "label": "positive" | "neutral" | "negative" | "critical"
      }

      Ticket Subject: ${subject}
      Ticket Description: ${description}
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text || '';
        const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const parsed = JSON.parse(jsonStr);

        // Detect trigger keywords
        const keywords = ESCALATION_KEYWORDS.filter(kw => fullText.includes(kw));

        return {
            score: Math.min(1, Math.max(-1, parsed.score || 0)),
            magnitude: Math.min(1, Math.max(0, parsed.magnitude || 0.5)),
            label: parsed.label || 'neutral',
            keywords,
        };
    } catch {
        // Fallback: keyword-based heuristic analysis
        return heuristicSentiment(fullText);
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
// Escalation Probability Model
// ============================================

/**
 * Build a mock resolution history from existing tickets.
 * In production this would query historical data from the database.
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

    // SLA breach rate (tickets without resolved status)
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

/**
 * Predict escalation probability for a ticket.
 * 
 * Combines multiple signals into a weighted probability:
 * - Sentiment score (negative → higher risk)
 * - SLA breach proximity
 * - Historical repeat complaints
 * - Priority level
 * - Agent response delay patterns
 */
export async function predictEscalation(
    ticket: Ticket,
    allTickets: Ticket[],
    config?: Partial<TenantAIConfig>
): Promise<EscalationPrediction> {
    const startTime = Date.now();

    // 1. Run NLP sentiment analysis
    const sentiment = await analyzeSentiment(ticket.subject, ticket.description);

    // 2. Build historical context
    const history = buildResolutionHistory(allTickets, ticket.creator_id);

    // 3. Check for repeat complaints
    const creatorTickets = allTickets.filter(t => t.creator_id === ticket.creator_id);
    const isRepeatComplaint = creatorTickets.length > 1;

    // 4. Compute escalation probability from multiple signals
    const signals = {
        sentimentRisk: Math.max(0, (1 - sentiment.score) / 2) * 0.30,
        slaBreach: history.slaBreachRate * 0.20,
        repeatComplaint: history.repeatComplaintRate * 0.15,
        priorityRisk: getPriorityRiskFactor(ticket.priority) * 0.20,
        responseDelay: computeResponseDelay(ticket) * 0.15,
    };

    const probability = Math.min(1, Object.values(signals).reduce((a, b) => a + b, 0));

    // 5. Determine risk level
    let riskLevel: EscalationPrediction['riskLevel'];
    if (probability >= 0.8) riskLevel = 'critical';
    else if (probability >= 0.6) riskLevel = 'high';
    else if (probability >= 0.35) riskLevel = 'medium';
    else riskLevel = 'low';

    // 6. Generate trigger factors
    const triggerFactors: string[] = [];
    if (sentiment.label === 'critical' || sentiment.label === 'negative') {
        triggerFactors.push(`Negative sentiment detected (score: ${sentiment.score.toFixed(2)})`);
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

    // 7. Generate recommended actions
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
    if (recommendedActions.length === 0) {
        recommendedActions.push('Standard processing — no intervention needed');
    }

    // 8. Suggest priority reassignment if warranted
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

    return {
        ticketId: ticket.id,
        probability,
        riskLevel,
        triggerFactors,
        recommendedActions,
        sentiment,
        isRepeatComplaint,
        predictedResolutionHours: history.categoryResolutionRate[ticket.category] || history.avgResolutionHours,
        shouldAutoEscalate: probability >= threshold,
        suggestedPriority,
    };
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
