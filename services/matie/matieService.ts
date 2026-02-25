/**
 * MATIE — Orchestrator Service
 * 
 * High-level API that coordinates the MFIS Engine and Escalation Prediction 
 * Engine into a unified intelligence layer. This is the single entry point 
 * for all MATIE AI operations.
 */

import type { Ticket, Profile } from '../../types';
import type {
    MATIEAnalysis,
    AgentScore,
    TenantAIConfig,
    AIInsights,
    RoutingFeedback,
    AgentCapability,
    ExplainabilityReport,
    MFISWeights,
} from './types';
import { DEFAULT_TENANT_AI_CONFIG, DEFAULT_MFIS_WEIGHTS } from './types';
import { scoreAgents, recalibrateWeights } from './mfisEngine';
import { predictEscalation } from './escalationEngine';
import { ESCALATION_ENGINE_VERSION } from './escalationEngine';
import { logAnalysis, loadTenantWeights, saveTenantWeights } from './aiAuditLog';
import { recordLatency } from './aiMetrics';
import { logger } from '../logger';
import { checkRateLimit } from '../security';

// Model version for traceability
const MATIE_MODEL_VERSION = `matie-v2.0.0+${ESCALATION_ENGINE_VERSION}`;

// ============================================
// Primary MATIE Analysis
// ============================================

/**
 * Perform complete MATIE analysis on a ticket.
 * 
 * Pipeline:
 * 1. Run NLP sentiment analysis
 * 2. Predict escalation probability
 * 3. Score all available agents via MFIS
 * 4. Generate recommended assignment + priority
 * 5. Compile insights
 * 
 * @param ticket       The ticket to analyze
 * @param agents       Available agent capability profiles
 * @param allTickets   Historical tickets for escalation analysis
 * @param config       Tenant-specific AI configuration
 * @returns            Complete MATIEAnalysis result
 */
export async function analyzeTicket(
    ticket: Ticket,
    agents: AgentCapability[],
    allTickets: Ticket[],
    config?: Partial<TenantAIConfig>,
    tenantId?: string
): Promise<MATIEAnalysis> {
    const startTime = Date.now();

    // INPUT VALIDATION
    if (!ticket?.id || !ticket?.subject) {
        throw new Error('Invalid ticket: missing id or subject');
    }
    if (!Array.isArray(agents)) {
        throw new Error('Invalid agents: expected array');
    }

    // RATE LIMITING (per tenant)
    if (tenantId && !checkRateLimit(`matie:${tenantId}`, 60, 60_000)) {
        logger.warn('MATIE rate limit exceeded', { tenantId });
        throw new Error('Rate limit exceeded — please try again shortly');
    }

    const mergedConfig = { ...DEFAULT_TENANT_AI_CONFIG, ...config };

    // Step 0: Load Firestore-stored weights (config-driven per tenant)
    let activeWeights = mergedConfig.mfisWeights;
    if (tenantId) {
        try {
            const storedWeights = await loadTenantWeights(tenantId);
            if (storedWeights) {
                activeWeights = storedWeights;
                logger.info('Loaded custom tenant weights from Firestore', { tenantId });
            }
        } catch {
            // Fall back to config weights
        }
    }

    // Step 1 & 2: Escalation prediction (includes sentiment + trend analysis)
    const escalation = await predictEscalation(ticket, allTickets, mergedConfig, tenantId);

    // Step 3: Score agents using MFIS with tenant-specific weights
    const agentRankings = scoreAgents(
        ticket,
        agents,
        escalation.sentiment,
        escalation.probability,
        activeWeights,
        mergedConfig.maxAgentsToScore
    );

    // Populate agent names from the rankings
    agents.forEach(agent => {
        const ranking = agentRankings.find(r => r.agentId === agent.agentId);
        if (ranking) ranking.agentName = agent.agentId;
    });

    // Step 4: Determine recommended assignment
    const recommendedAgentId = agentRankings.length > 0
        ? agentRankings[0].agentId
        : null;

    const recommendedPriority = escalation.suggestedPriority || ticket.priority;

    // Step 5: Overall confidence — weighted average of top agent + escalation confidence + sentiment confidence
    const topAgentConfidence = agentRankings.length > 0 ? agentRankings[0].confidence : 0.5;
    const sentimentWeight = escalation.sentimentConfidence > 0 ? escalation.sentimentConfidence : 0.6;
    const aiConfidence = (
        topAgentConfidence * 0.4 +
        (1 - escalation.probability * 0.3) * 0.3 +
        sentimentWeight * 0.3
    );

    // Step 6: Compile insights
    const insights = generateInsights(ticket, agentRankings, escalation);

    // Step 7: Attach top-agent explainability report to analysis
    const explainabilityReport: ExplainabilityReport = agentRankings.length > 0
        ? agentRankings[0].explainability
        : {
            topFactors: ['No agents available for scoring'],
            weightContribution: {},
            decisionTrace: 'No agents were available for MFIS scoring.',
            confidenceBreakdown: { factorConsistency: 0, dataQuality: 0, modelCalibration: 0 },
        };

    const analysis: MATIEAnalysis = {
        ticketId: ticket.id,
        timestamp: new Date().toISOString(),
        agentRankings,
        escalation,
        recommendedAgentId,
        recommendedPriority,
        aiConfidence: Math.min(1, Math.max(0, aiConfidence)),
        processingTimeMs: Date.now() - startTime,
        insights,
        explainabilityReport,
        modelVersion: MATIE_MODEL_VERSION,
    };

    // AUDIT: Persist AI decision to immutable audit trail
    if (tenantId) {
        logAnalysis(tenantId, analysis).catch(() => {
            // Non-blocking — don't fail ticket analysis if audit log fails
        });
    }

    logger.info('MATIE analysis completed', {
        ticketId: ticket.id,
        confidence: analysis.aiConfidence.toFixed(2),
        escalationRisk: escalation.riskLevel,
        agentsScored: agentRankings.length,
        processingMs: analysis.processingTimeMs,
    });

    // Track latency for observability metrics
    recordLatency(analysis.processingTimeMs);

    return analysis;
}

// ============================================
// Real-Time Weight Recalibration
// ============================================

/**
 * Trigger MFIS weight recalibration using recent feedback.
 * Loads feedback data, computes new weights via gradient adjustment,
 * and persists them to Firestore for the tenant.
 * 
 * Should be called periodically (e.g., after every 10 resolved tickets)
 * or manually by an admin from the dashboard.
 */
export async function triggerRecalibration(
    tenantId: string,
    recentFeedback: RoutingFeedback[],
    currentWeights?: MFISWeights
): Promise<MFISWeights> {
    const baseWeights = currentWeights || DEFAULT_MFIS_WEIGHTS;

    if (recentFeedback.length < 5) {
        logger.info('Not enough feedback for recalibration', {
            tenantId,
            feedbackCount: recentFeedback.length,
            minRequired: 5,
        });
        return baseWeights;
    }

    // Recalibrate weights using feedback gradient
    const newWeights = recalibrateWeights(baseWeights, recentFeedback);

    // Persist to Firestore
    const saved = await saveTenantWeights(tenantId, newWeights);

    logger.info('MFIS weight recalibration completed', {
        tenantId,
        feedbackCount: recentFeedback.length,
        saved,
        oldWeights: baseWeights,
        newWeights,
    });

    return newWeights;
}

// ============================================
// AI Insights for Dashboard
// ============================================

/**
 * Generate tenant-level AI performance insights.
 * In production, this aggregates from historical MATIE analysis records.
 * Currently generates realistic computed metrics from ticket data.
 */
export function getAIInsights(
    tenantId: string,
    tickets: Ticket[],
    period: 'day' | 'week' | 'month' = 'week'
): AIInsights {
    const now = Date.now();
    const periodMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
    }[period];

    const periodTickets = tickets.filter(t =>
        (now - new Date(t.created_at).getTime()) <= periodMs
    );

    const resolved = periodTickets.filter(t =>
        t.status === 'resolved' || t.status === 'closed'
    );

    // Compute resolution times
    const resolutionHours = resolved
        .filter(t => t.updated_at)
        .map(t => {
            const created = new Date(t.created_at).getTime();
            const updated = new Date(t.updated_at).getTime();
            return Math.max(0, (updated - created) / (1000 * 60 * 60));
        });

    const avgResolution = resolutionHours.length > 0
        ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
        : 0;

    // SLA compliance
    const withSLA = periodTickets.filter(t => t.sla_deadline);
    const slaCompliant = withSLA.filter(t => {
        if (t.status === 'resolved' || t.status === 'closed') {
            return new Date(t.updated_at).getTime() <= new Date(t.sla_deadline!).getTime();
        }
        return new Date(t.sla_deadline!).getTime() > now;
    });

    // Category breakdown
    const categoryMap: Record<string, { count: number; totalScore: number }> = {};
    periodTickets.forEach(t => {
        if (!categoryMap[t.category]) categoryMap[t.category] = { count: 0, totalScore: 0 };
        categoryMap[t.category].count++;
        categoryMap[t.category].totalScore += t.priority === 'urgent' ? 0.9 : t.priority === 'high' ? 0.7 : 0.5;
    });

    const topCategories = Object.entries(categoryMap)
        .map(([category, data]) => ({
            category,
            count: data.count,
            avgScore: data.totalScore / data.count,
        }))
        .sort((a, b) => b.count - a.count);

    // Sentiment trend — computed from ticket creation dates (deterministic)
    const sentimentTrend = Array.from({ length: 7 }, (_, i) => {
        const dayStart = now - (6 - i) * 24 * 60 * 60 * 1000;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const dayTickets = periodTickets.filter(t => {
            const created = new Date(t.created_at).getTime();
            return created >= dayStart && created < dayEnd;
        });
        // Compute sentiment proxy from priority distribution (deterministic)
        const avgPriorityScore = dayTickets.length > 0
            ? dayTickets.reduce((sum, t) => {
                const pScore = t.priority === 'urgent' ? -0.5 : t.priority === 'high' ? -0.1 : t.priority === 'medium' ? 0.2 : 0.4;
                return sum + pScore;
            }, 0) / dayTickets.length
            : 0.2;
        return {
            date: new Date(dayStart).toISOString().split('T')[0],
            avgSentiment: Math.round(avgPriorityScore * 100) / 100,
        };
    });

    // Compute deterministic routing accuracy from resolved tickets
    // (proxy: ratio of tickets resolved by their originally assigned agent)
    const assignedAndResolved = resolved.filter(t => t.assignee_id);
    const routingAccuracy = assignedAndResolved.length > 0
        ? assignedAndResolved.length / Math.max(1, periodTickets.length)
        : 0;

    // Compute deterministic escalation prevention rate
    const highPriorityResolved = resolved.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const highPriorityTotal = periodTickets.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const escalationPreventionRate = highPriorityTotal.length > 0
        ? highPriorityResolved.length / highPriorityTotal.length
        : 0;

    // Compute average confidence from actual resolution data (deterministic)
    const avgConfidence = resolved.length > 0
        ? Math.min(0.95, 0.5 + (resolved.length / Math.max(1, periodTickets.length)) * 0.4)
        : 0;

    return {
        tenantId,
        period,
        routingAccuracy: Math.round(routingAccuracy * 1000) / 1000,
        avgResolutionTimeHours: Math.round(avgResolution * 10) / 10,
        escalationPreventionRate: Math.round(escalationPreventionRate * 1000) / 1000,
        slaComplianceRate: withSLA.length > 0 ? slaCompliant.length / withSLA.length : 1,
        aiProcessedTickets: periodTickets.length,
        avgConfidenceScore: Math.round(avgConfidence * 1000) / 1000,
        topCategories,
        sentimentTrend,
    };
}

// ============================================
// Weight Recalibration API
// ============================================

/**
 * Process a batch of routing feedback and recalibrate weights.
 * Returns updated TenantAIConfig with new weights.
 */
export function processRecalibration(
    currentConfig: TenantAIConfig,
    feedback: RoutingFeedback[]
): TenantAIConfig {
    const newWeights = recalibrateWeights(
        currentConfig.mfisWeights,
        feedback,
        0.05 // Learning rate
    );

    return {
        ...currentConfig,
        mfisWeights: newWeights,
        updatedAt: new Date().toISOString(),
    };
}

// ============================================
// Insight Generation
// ============================================

/**
 * Generate human-readable insights from MATIE analysis.
 */
function generateInsights(
    ticket: Ticket,
    rankings: AgentScore[],
    escalation: ReturnType<Awaited<typeof predictEscalation>> extends Promise<infer T> ? T : never
): string[] {
    const insights: string[] = [];

    // Escalation insights
    if (escalation.riskLevel === 'critical') {
        insights.push('⚠️ CRITICAL: High escalation risk detected — immediate attention required');
    } else if (escalation.riskLevel === 'high') {
        insights.push('🔶 Elevated escalation risk — consider assigning to senior agent');
    }

    // Sentiment insights
    if (escalation.sentiment.label === 'critical') {
        insights.push('😡 Customer sentiment is critical — empathetic communication recommended');
    } else if (escalation.sentiment.label === 'negative') {
        insights.push('😟 Negative sentiment detected — handle with care');
    }

    // Repeat complaint
    if (escalation.isRepeatComplaint) {
        insights.push('🔄 This customer has submitted similar tickets before — check for recurring issues');
    }

    // Routing quality
    if (rankings.length > 0) {
        const topAgent = rankings[0];
        if (topAgent.confidence >= 0.8) {
            insights.push(`✅ High-confidence agent match (${(topAgent.confidence * 100).toFixed(0)}%)`);
        } else if (topAgent.confidence < 0.5) {
            insights.push('⚡ Low confidence in agent matching — manual review suggested');
        }

        if (topAgent.factors.expertiseMatch > 0.7) {
            insights.push('🎯 Strong category expertise match for top agent');
        }
    }

    // Priority recommendation
    if (escalation.suggestedPriority && escalation.suggestedPriority !== ticket.priority) {
        insights.push(`📈 AI recommends upgrading priority: ${ticket.priority} → ${escalation.suggestedPriority}`);
    }

    // Processing time
    insights.push(`⚡ Analysis completed — ${rankings.length} agents evaluated`);

    return insights;
}

// ============================================
// Utility: Build Agent Capabilities from Profiles
// ============================================

/**
 * Convert user profiles into AgentCapability objects for MFIS scoring.
 * Enriches profiles with computed capability data.
 */
export function buildAgentCapabilities(
    agents: Profile[],
    allTickets: Ticket[]
): AgentCapability[] {
    return agents
        .filter(a =>
            a.is_active &&
            ['support_agent', 'it_manager', 'company_admin'].includes(a.role_id)
        )
        .map(agent => {
            const agentTickets = allTickets.filter(t => t.assignee_id === agent.id);
            const openTickets = agentTickets.filter(t =>
                t.status === 'open' || t.status === 'in_progress'
            );
            const resolvedTickets = agentTickets.filter(t =>
                t.status === 'resolved' || t.status === 'closed'
            );

            // Compute average resolution time
            const resolutionTimes = resolvedTickets
                .filter(t => t.updated_at)
                .map(t => {
                    const created = new Date(t.created_at).getTime();
                    const updated = new Date(t.updated_at).getTime();
                    return Math.max(0, (updated - created) / (1000 * 60 * 60));
                });

            const avgResolution = resolutionTimes.length > 0
                ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
                : 24;

            // Infer categories from resolved tickets
            const categoryCounts: Record<string, number> = {};
            resolvedTickets.forEach(t => {
                categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
            });
            const categories = Object.keys(categoryCounts) as Array<typeof allTickets[0]['category']>;

            // Compute satisfaction from resolution metrics (deterministic, no Math.random)
            // Higher resolution rate + faster resolution = higher rating
            const resolutionRate = agentTickets.length > 0
                ? resolvedTickets.length / agentTickets.length
                : 0.5;
            const speedFactor = Math.max(0, 1 - (avgResolution / 48)); // Faster than 48h = bonus
            const computedRating = Math.min(5, Math.max(1, 2 + resolutionRate * 2 + speedFactor));

            return {
                agentId: agent.id,
                categories: categories.length > 0 ? categories : ['software', 'other'],
                skills: [],
                avgResolutionHours: avgResolution,
                currentOpenTickets: openTickets.length,
                maxConcurrentTickets: 10,
                satisfactionRating: Math.round(computedRating * 10) / 10,
                isAvailable: agent.is_active,
            };
        });
}
