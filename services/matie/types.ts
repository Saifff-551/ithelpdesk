/**
 * MATIE — MetaMinds Adaptive Ticket Intelligence Engine
 * Core Type Definitions
 * 
 * Patent-grade type system for the Multi-Factor Intelligence Scoring (MFIS)
 * engine, Escalation Prediction Engine, and orchestration layer.
 */

import type { TicketPriority, TicketCategory, TicketStatus } from '../../types';

// ============================================
// MFIS (Multi-Factor Intelligence Scoring)
// ============================================

/**
 * Dynamic weight profile for MFIS scoring formula.
 * Each weight is a value between 0 and 1, and all weights should sum to 1.0.
 * Weights are recalibrated via feedback loops per tenant.
 * 
 * Formula:
 * FinalScore = (W1 × ExpertiseMatch) + (W2 × SentimentScore) + 
 *              (W3 × WorkloadIndex) + (W4 × SLAUrgencyWeight) + 
 *              (W5 × EscalationProbability)
 */
export interface MFISWeights {
    expertiseMatch: number;      // W1 — Agent skill alignment
    sentimentScore: number;      // W2 — Customer sentiment factor
    workloadIndex: number;       // W3 — Agent capacity inverse
    slaUrgencyWeight: number;    // W4 — SLA deadline proximity
    escalationProbability: number; // W5 — Predicted escalation risk
}

/** Default initial weights (empirically balanced for general helpdesk) */
export const DEFAULT_MFIS_WEIGHTS: MFISWeights = {
    expertiseMatch: 0.30,
    sentimentScore: 0.15,
    workloadIndex: 0.20,
    slaUrgencyWeight: 0.20,
    escalationProbability: 0.15,
};

/**
 * Individual factor scores computed for an agent-ticket pair.
 * All values normalized to 0.0 — 1.0 range.
 */
export interface MFISFactors {
    expertiseMatch: number;
    sentimentScore: number;
    workloadIndex: number;
    slaUrgencyWeight: number;
    escalationProbability: number;
}

/**
 * Final MFIS result for a single agent evaluated against a ticket.
 */
export interface AgentScore {
    agentId: string;
    agentName: string;
    finalScore: number;          // Weighted composite score (0-1)
    factors: MFISFactors;        // Individual factor breakdown
    rank: number;                // 1 = best match
    confidence: number;          // Model confidence (0-1)
    reasoning: string;           // Human-readable justification
    explainability: ExplainabilityReport; // Patent-grade decision traceability
}

/**
 * Explainability report for AI decision traceability.
 * Every routing decision is decomposed into traceable factor contributions.
 * 
 * Patent-relevant: Provides full transparency into AI decision-making,
 * enabling audit compliance and regulatory review.
 */
export interface ExplainabilityReport {
    topFactors: string[];                        // Ranked human-readable factors
    weightContribution: Record<string, number>;  // Factor → weighted contribution to score
    decisionTrace: string;                       // Full narrative of the routing decision
    confidenceBreakdown: {
        factorConsistency: number;               // How consistent factors are (0-1)
        dataQuality: number;                     // Quality of input data (0-1)
        modelCalibration: number;                // Weight calibration quality (0-1)
    };
}

// ============================================
// Escalation Prediction Engine
// ============================================

/** Sentiment analysis result from NLP processing */
export interface SentimentAnalysis {
    score: number;               // -1.0 (very negative) to 1.0 (very positive)
    magnitude: number;           // Emotional intensity (0.0 to 1.0)
    label: 'positive' | 'neutral' | 'negative' | 'critical';
    keywords: string[];          // Trigger words detected
}

/** Historical patterns used for escalation prediction */
export interface ResolutionHistory {
    avgResolutionHours: number;
    medianResolutionHours: number;
    slaBreachRate: number;       // 0-1, fraction of tickets that breached SLA
    repeatComplaintRate: number; // 0-1, fraction of repeat issues from same creator
    categoryResolutionRate: Record<string, number>; // category → avg hours
}

/**
 * Escalation prediction result for a single ticket.
 */
export interface EscalationPrediction {
    ticketId: string;
    probability: number;          // 0.0 — 1.0 escalation likelihood (sigmoid-normalized)
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    triggerFactors: string[];     // Reasons driving the prediction
    recommendedActions: string[]; // Suggested interventions
    sentiment: SentimentAnalysis;
    sentimentConfidence: number;  // Gemini NLP confidence (0-1), 0 = heuristic fallback
    isRepeatComplaint: boolean;
    predictedResolutionHours: number;
    shouldAutoEscalate: boolean;  // True if probability > threshold
    suggestedPriority?: TicketPriority; // Auto-priority reassignment
    trendSignals: TrendSignal[];  // Historical trend patterns detected
}

/**
 * Trend signal from historical pattern analysis.
 * Patent-relevant: Documents the multi-signal analysis used for prediction.
 */
export interface TrendSignal {
    signal: string;              // Signal name (e.g., 'volume_spike', 'repeat_creator')
    direction: 'rising' | 'falling' | 'stable';
    strength: number;            // 0-1 signal strength
    description: string;         // Human-readable explanation
}

/**
 * Escalation prediction audit entry — stored to Firestore per prediction.
 */
export interface EscalationAuditEntry {
    ticketId: string;
    tenantId: string;
    timestamp: string;
    probability: number;
    riskLevel: string;
    sentimentScore: number;
    sentimentLabel: string;
    sentimentConfidence: number;
    triggerFactors: string[];
    trendSignals: TrendSignal[];
    isRepeatComplaint: boolean;
    modelVersion: string;
}

// ============================================
// MATIE Orchestrator
// ============================================

/**
 * Complete MATIE analysis result for a ticket.
 * Combines MFIS routing + escalation prediction into one intelligence package.
 */
export interface MATIEAnalysis {
    ticketId: string;
    timestamp: string;
    agentRankings: AgentScore[];           // Sorted by finalScore desc
    escalation: EscalationPrediction;
    recommendedAgentId: string | null;     // Top-ranked agent
    recommendedPriority: TicketPriority;   // AI-suggested priority
    aiConfidence: number;                  // Overall confidence (0-1)
    processingTimeMs: number;
    insights: string[];                    // Human-readable AI insights
    explainabilityReport: ExplainabilityReport; // Top-agent explainability
    modelVersion: string;                  // Engine version for traceability
}

/**
 * Per-tenant AI configuration — controls MATIE behavior per organization.
 */
export interface TenantAIConfig {
    tenantId: string;
    mfisWeights: MFISWeights;
    autoAssignEnabled: boolean;
    autoEscalateEnabled: boolean;
    escalationThreshold: number;           // Probability threshold (default 0.75)
    sentimentAlertThreshold: number;       // Sentiment score threshold (default -0.5)
    feedbackLoopEnabled: boolean;
    maxAgentsToScore: number;              // Performance limit (default 20)
    updatedAt: string;
}

/** Default tenant AI config */
export const DEFAULT_TENANT_AI_CONFIG: Omit<TenantAIConfig, 'tenantId' | 'updatedAt'> = {
    mfisWeights: DEFAULT_MFIS_WEIGHTS,
    autoAssignEnabled: true,
    autoEscalateEnabled: true,
    escalationThreshold: 0.75,
    sentimentAlertThreshold: -0.5,
    feedbackLoopEnabled: true,
    maxAgentsToScore: 20,
};

/**
 * Tenant-level AI performance insights for the dashboard.
 */
export interface AIInsights {
    tenantId: string;
    period: 'day' | 'week' | 'month';
    routingAccuracy: number;               // % of AI assignments not reassigned
    avgResolutionTimeHours: number;
    escalationPreventionRate: number;      // % of predicted escalations avoided
    slaComplianceRate: number;             // % of tickets resolved within SLA
    aiProcessedTickets: number;            // Total tickets analyzed by MATIE
    avgConfidenceScore: number;
    topCategories: { category: string; count: number; avgScore: number }[];
    sentimentTrend: { date: string; avgSentiment: number }[];
}

/**
 * Feedback signal used for weight recalibration.
 */
export interface RoutingFeedback {
    ticketId: string;
    originalAgentId: string;
    finalAgentId: string;                  // Same if not reassigned
    wasReassigned: boolean;
    resolutionTimeHours: number;
    customerSatisfaction?: number;         // 1-5 rating if available
    slaMet: boolean;
    timestamp: string;
}

/**
 * Agent capability profile for expertise matching.
 */
export interface AgentCapability {
    agentId: string;
    categories: TicketCategory[];          // Categories the agent handles
    skills: string[];                      // Custom skill tags
    avgResolutionHours: number;
    currentOpenTickets: number;
    maxConcurrentTickets: number;
    satisfactionRating: number;            // Running average (1-5)
    isAvailable: boolean;
    shiftStart?: string;                   // "09:00"
    shiftEnd?: string;                     // "18:00"
}
