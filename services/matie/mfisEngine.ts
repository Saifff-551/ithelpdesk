/**
 * MATIE — Multi-Factor Intelligence Scoring (MFIS) Engine
 * 
 * Core routing algorithm that evaluates agent-ticket compatibility using a 
 * dynamic weighted scoring formula. This is the patent-critical component 
 * implementing adaptive, feedback-driven agent assignment.
 * 
 * Formula:
 * FinalScore = (W1 × ExpertiseMatch) + (W2 × SentimentScore) + 
 *              (W3 × WorkloadIndex) + (W4 × SLAUrgencyWeight) + 
 *              (W5 × EscalationProbability)
 */

import type { Ticket, Profile, TicketCategory, TicketPriority } from '../../types';
import type {
    MFISWeights,
    MFISFactors,
    AgentScore,
    AgentCapability,
    TenantAIConfig,
    RoutingFeedback,
    SentimentAnalysis,
} from './types';
import { DEFAULT_MFIS_WEIGHTS } from './types';

// ============================================
// Factor Computation Functions
// ============================================

/**
 * Compute Expertise Match Score (0–1)
 * 
 * Measures how well an agent's skill profile aligns with the ticket category 
 * and content. Higher scores indicate stronger category specialization.
 */
export function computeExpertiseMatch(
    ticket: Ticket,
    agent: AgentCapability
): number {
    let score = 0;

    // Primary: Does agent handle this category?
    if (agent.categories.includes(ticket.category)) {
        score += 0.6;
    }

    // Secondary: Agent satisfaction rating indicates competence
    score += (agent.satisfactionRating / 5) * 0.25;

    // Tertiary: Resolution speed — faster agents score higher
    const speedFactor = Math.max(0, 1 - (agent.avgResolutionHours / 72));
    score += speedFactor * 0.15;

    return Math.min(1, Math.max(0, score));
}

/**
 * Compute Sentiment-Adjusted Score (0–1)
 * 
 * Maps sentiment analysis to a routing factor. Negative sentiment tickets 
 * require more experienced agents, so we invert the score to prefer 
 * higher-rated agents for difficult customers.
 */
export function computeSentimentFactor(sentiment: SentimentAnalysis): number {
    // Transform -1..1 sentiment to 0..1 urgency factor
    // Very negative sentiment → high urgency (1.0)
    // Very positive sentiment → low urgency (0.1)
    const urgency = Math.max(0.1, (1 - sentiment.score) / 2);

    // Magnitude amplifies the effect
    const amplified = urgency * (0.7 + sentiment.magnitude * 0.3);

    return Math.min(1, Math.max(0, amplified));
}

/**
 * Compute Workload Index (0–1)
 * 
 * Inverse workload factor — agents with fewer open tickets score higher.
 * This ensures load balancing across the support team.
 */
export function computeWorkloadIndex(agent: AgentCapability): number {
    if (!agent.isAvailable) return 0;
    if (agent.maxConcurrentTickets === 0) return 0;

    const utilization = agent.currentOpenTickets / agent.maxConcurrentTickets;
    const availability = Math.max(0, 1 - utilization);

    return Math.min(1, Math.max(0, availability));
}

/**
 * Compute SLA Urgency Weight (0–1)
 * 
 * Calculates urgency based on SLA deadline proximity. Tickets closer to 
 * their SLA breach deadline receive higher urgency scores.
 */
export function computeSLAUrgency(ticket: Ticket): number {
    const priorityWeights: Record<TicketPriority, number> = {
        urgent: 1.0,
        high: 0.75,
        medium: 0.45,
        low: 0.2,
    };

    let baseUrgency = priorityWeights[ticket.priority] || 0.45;

    // Factor in SLA deadline proximity if available
    if (ticket.sla_deadline) {
        const deadline = new Date(ticket.sla_deadline).getTime();
        const now = Date.now();
        const created = new Date(ticket.created_at).getTime();
        const totalWindow = deadline - created;
        const elapsed = now - created;

        if (totalWindow > 0) {
            const timeRatio = Math.min(1, elapsed / totalWindow);
            // Exponential urgency curve — urgency rises sharply near deadline
            const deadlinePressure = Math.pow(timeRatio, 2);
            baseUrgency = Math.min(1, baseUrgency * 0.5 + deadlinePressure * 0.5);
        }
    }

    return Math.min(1, Math.max(0, baseUrgency));
}

// ============================================
// MFIS Core Scoring
// ============================================

/**
 * Compute all MFIS factors for an agent-ticket pair.
 */
export function computeFactors(
    ticket: Ticket,
    agent: AgentCapability,
    sentiment: SentimentAnalysis,
    escalationProb: number
): MFISFactors {
    return {
        expertiseMatch: computeExpertiseMatch(ticket, agent),
        sentimentScore: computeSentimentFactor(sentiment),
        workloadIndex: computeWorkloadIndex(agent),
        slaUrgencyWeight: computeSLAUrgency(ticket),
        escalationProbability: Math.min(1, Math.max(0, escalationProb)),
    };
}

/**
 * Apply MFIS weighted formula to compute final composite score.
 */
export function computeFinalScore(
    factors: MFISFactors,
    weights: MFISWeights
): number {
    const score =
        weights.expertiseMatch * factors.expertiseMatch +
        weights.sentimentScore * factors.sentimentScore +
        weights.workloadIndex * factors.workloadIndex +
        weights.slaUrgencyWeight * factors.slaUrgencyWeight +
        weights.escalationProbability * factors.escalationProbability;

    return Math.min(1, Math.max(0, score));
}

/**
 * Score and rank all available agents for a given ticket.
 * Returns sorted AgentScores (highest first).
 */
export function scoreAgents(
    ticket: Ticket,
    agents: AgentCapability[],
    sentiment: SentimentAnalysis,
    escalationProb: number,
    weights: MFISWeights = DEFAULT_MFIS_WEIGHTS,
    maxAgents: number = 20
): AgentScore[] {
    const availableAgents = agents
        .filter(a => a.isAvailable)
        .slice(0, maxAgents);

    const scored: AgentScore[] = availableAgents.map(agent => {
        const factors = computeFactors(ticket, agent, sentiment, escalationProb);
        const finalScore = computeFinalScore(factors, weights);

        // Compute confidence based on factor consistency
        const factorValues = Object.values(factors);
        const mean = factorValues.reduce((a, b) => a + b, 0) / factorValues.length;
        const variance = factorValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / factorValues.length;
        const confidence = Math.max(0.3, 1 - Math.sqrt(variance));

        return {
            agentId: agent.agentId,
            agentName: '',  // Populated by caller
            finalScore,
            factors,
            rank: 0,        // Set after sorting
            confidence,
            reasoning: generateReasoning(factors, weights, agent),
        };
    });

    // Sort by score descending and assign ranks
    scored.sort((a, b) => b.finalScore - a.finalScore);
    scored.forEach((s, i) => { s.rank = i + 1; });

    return scored;
}

/**
 * Generate human-readable reasoning for an agent assignment.
 */
function generateReasoning(
    factors: MFISFactors,
    weights: MFISWeights,
    agent: AgentCapability
): string {
    const reasons: string[] = [];

    if (factors.expertiseMatch > 0.7) {
        reasons.push(`Strong expertise match in ${agent.categories.join(', ')}`);
    }
    if (factors.workloadIndex > 0.7) {
        reasons.push(`Low workload (${agent.currentOpenTickets}/${agent.maxConcurrentTickets} tickets)`);
    }
    if (factors.slaUrgencyWeight > 0.7) {
        reasons.push('High SLA urgency — experienced agent needed');
    }
    if (factors.escalationProbability > 0.6) {
        reasons.push('Elevated escalation risk — routing to senior agent');
    }
    if (factors.sentimentScore > 0.7) {
        reasons.push('Negative customer sentiment detected — empathetic agent preferred');
    }

    return reasons.length > 0
        ? reasons.join('. ') + '.'
        : 'Balanced scoring across all factors.';
}

// ============================================
// Weight Recalibration (Self-Learning Loop)
// ============================================

/**
 * Recalibrate MFIS weights based on historical feedback data.
 * 
 * Uses a gradient-descent-inspired approach: weights that correlate with 
 * successful outcomes (no reassignment, fast resolution, SLA met) are 
 * increased; weights correlated with failures are decreased.
 * 
 * This is the "self-learning adaptation loop" described in the patent.
 */
export function recalibrateWeights(
    currentWeights: MFISWeights,
    feedbackBatch: RoutingFeedback[],
    learningRate: number = 0.05
): MFISWeights {
    if (feedbackBatch.length === 0) return currentWeights;

    // Compute success metrics
    const successRate = feedbackBatch.filter(f => !f.wasReassigned).length / feedbackBatch.length;
    const avgSatisfaction = feedbackBatch
        .filter(f => f.customerSatisfaction !== undefined)
        .reduce((sum, f) => sum + (f.customerSatisfaction || 3), 0) /
        Math.max(1, feedbackBatch.filter(f => f.customerSatisfaction !== undefined).length);
    const slaMetRate = feedbackBatch.filter(f => f.slaMet).length / feedbackBatch.length;

    // Direction signals — positive means "increase this weight"
    const signals = {
        expertiseMatch: (successRate - 0.5) * 2,      // Skills matter more when success is high
        sentimentScore: (1 - successRate) * 0.5,       // Sentiment matters more when reassignment is high
        workloadIndex: (slaMetRate - 0.5) * 2,         // Workload balance matters for SLA
        slaUrgencyWeight: (1 - slaMetRate) * 2,        // SLA urgency increases when breach rate is high
        escalationProbability: (1 - successRate) * 1.5, // Escalation weight up when routing fails
    };

    // Apply gradient updates
    const rawWeights: MFISWeights = {
        expertiseMatch: currentWeights.expertiseMatch + learningRate * signals.expertiseMatch,
        sentimentScore: currentWeights.sentimentScore + learningRate * signals.sentimentScore,
        workloadIndex: currentWeights.workloadIndex + learningRate * signals.workloadIndex,
        slaUrgencyWeight: currentWeights.slaUrgencyWeight + learningRate * signals.slaUrgencyWeight,
        escalationProbability: currentWeights.escalationProbability + learningRate * signals.escalationProbability,
    };

    // Normalize weights to sum to 1.0
    return normalizeWeights(rawWeights);
}

/**
 * Normalize weights so they sum to 1.0, clamping each to [0.05, 0.50].
 */
export function normalizeWeights(weights: MFISWeights): MFISWeights {
    const clamp = (v: number) => Math.min(0.50, Math.max(0.05, v));

    const clamped = {
        expertiseMatch: clamp(weights.expertiseMatch),
        sentimentScore: clamp(weights.sentimentScore),
        workloadIndex: clamp(weights.workloadIndex),
        slaUrgencyWeight: clamp(weights.slaUrgencyWeight),
        escalationProbability: clamp(weights.escalationProbability),
    };

    const sum = Object.values(clamped).reduce((a, b) => a + b, 0);

    return {
        expertiseMatch: clamped.expertiseMatch / sum,
        sentimentScore: clamped.sentimentScore / sum,
        workloadIndex: clamped.workloadIndex / sum,
        slaUrgencyWeight: clamped.slaUrgencyWeight / sum,
        escalationProbability: clamped.escalationProbability / sum,
    };
}
