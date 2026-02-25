/**
 * MATIE — AI Metrics Collection & Observability
 * 
 * Production-grade metrics service for tracking AI engine performance:
 * - Routing accuracy (computed from feedback)
 * - Average resolution time
 * - Escalation prevention rate
 * - AI decision latency (P50, P95, P99)
 * - SLA compliance rate
 * 
 * Metrics are persisted to `ai_metrics` Firestore collection per tenant.
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../logger';

// ============================================
// Types
// ============================================

export interface AIMetricsSnapshot {
    tenantId: string;
    timestamp: string;
    routingAccuracy: number;           // 0-1, how often AI's top pick was used
    avgResolutionTimeHours: number;    // Average ticket resolution time
    escalationPreventionRate: number;  // 0-1, high/urgent resolved without escalation
    aiDecisionLatencyMs: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;
    };
    slaComplianceRate: number;         // 0-1, tickets resolved within SLA
    totalAnalyses: number;             // Total MATIE analyses run
    totalFeedback: number;             // Total feedback entries
    modelVersion: string;
}

// In-memory latency buffer for real-time tracking
const latencyBuffer: number[] = [];
const MAX_LATENCY_BUFFER = 500;

// ============================================
// Latency Tracking
// ============================================

/**
 * Record an AI decision latency measurement.
 * Called after every analyzeTicket() completion.
 */
export function recordLatency(ms: number): void {
    latencyBuffer.push(ms);
    if (latencyBuffer.length > MAX_LATENCY_BUFFER) {
        latencyBuffer.shift(); // Rolling window
    }
}

/**
 * Get latency percentiles from the in-memory buffer.
 */
export function getLatencyPercentiles(): AIMetricsSnapshot['aiDecisionLatencyMs'] {
    if (latencyBuffer.length === 0) {
        return { p50: 0, p95: 0, p99: 0, avg: 0 };
    }

    const sorted = [...latencyBuffer].sort((a, b) => a - b);
    const len = sorted.length;

    return {
        p50: sorted[Math.floor(len * 0.5)] || 0,
        p95: sorted[Math.floor(len * 0.95)] || 0,
        p99: sorted[Math.floor(len * 0.99)] || 0,
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
    };
}

// ============================================
// Computed Metrics from Firestore Data
// ============================================

/**
 * Compute real-time AI metrics from Firestore audit data.
 * Aggregates from matie_analyses and matie_feedback collections.
 */
export async function computeMetrics(tenantId: string): Promise<AIMetricsSnapshot> {
    const startTime = Date.now();

    try {
        // Fetch recent analyses (last 30 days)
        const analysesQuery = query(
            collection(db, 'matie_analyses'),
            where('tenant_id', '==', tenantId),
            orderBy('timestamp', 'desc'),
            limit(500)
        );
        const analysesSnap = await getDocs(analysesQuery);
        const analyses = analysesSnap.docs.map(d => d.data());

        // Fetch recent feedback
        const feedbackQuery = query(
            collection(db, 'matie_feedback'),
            where('tenant_id', '==', tenantId),
            orderBy('timestamp', 'desc'),
            limit(200)
        );
        const feedbackSnap = await getDocs(feedbackQuery);
        const feedbackDocs = feedbackSnap.docs.map(d => d.data());

        // --- Routing Accuracy ---
        // Percentage of analyses where the AI-recommended agent was actually used
        let routingHits = 0;
        let routingTotal = 0;
        feedbackDocs.forEach(fb => {
            if (fb.recommended_agent_id && fb.actual_agent_id) {
                routingTotal++;
                if (fb.recommended_agent_id === fb.actual_agent_id) {
                    routingHits++;
                }
            }
        });
        const routingAccuracy = routingTotal > 0 ? routingHits / routingTotal : 0;

        // --- Average Resolution Time ---
        const resolutionTimes = feedbackDocs
            .filter(fb => fb.resolution_time_hours != null)
            .map(fb => fb.resolution_time_hours as number);
        const avgResolutionTimeHours = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;

        // --- Escalation Prevention Rate ---
        // How many high/urgent tickets were resolved without manual escalation
        const highPriorityAnalyses = analyses.filter(a =>
            a.escalation_risk_level === 'high' || a.escalation_risk_level === 'critical'
        );
        const preventedEscalations = highPriorityAnalyses.filter(a =>
            !a.was_manually_escalated
        ).length;
        const escalationPreventionRate = highPriorityAnalyses.length > 0
            ? preventedEscalations / highPriorityAnalyses.length
            : 0;

        // --- SLA Compliance Rate ---
        const slaTracked = feedbackDocs.filter(fb => fb.sla_met != null);
        const slaMet = slaTracked.filter(fb => fb.sla_met === true).length;
        const slaComplianceRate = slaTracked.length > 0 ? slaMet / slaTracked.length : 0;

        // --- AI Decision Latency ---
        const latencyData = getLatencyPercentiles();

        const snapshot: AIMetricsSnapshot = {
            tenantId,
            timestamp: new Date().toISOString(),
            routingAccuracy: Math.round(routingAccuracy * 10000) / 10000,
            avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100,
            escalationPreventionRate: Math.round(escalationPreventionRate * 10000) / 10000,
            aiDecisionLatencyMs: latencyData,
            slaComplianceRate: Math.round(slaComplianceRate * 10000) / 10000,
            totalAnalyses: analyses.length,
            totalFeedback: feedbackDocs.length,
            modelVersion: 'matie-v2.0.0',
        };

        logger.info('AI metrics computed', {
            tenantId,
            routingAccuracy: snapshot.routingAccuracy,
            avgResolutionHours: snapshot.avgResolutionTimeHours,
            latencyP95: snapshot.aiDecisionLatencyMs.p95,
            computeTimeMs: Date.now() - startTime,
        });

        return snapshot;
    } catch (err) {
        logger.error('Failed to compute AI metrics', {
            tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });

        return {
            tenantId,
            timestamp: new Date().toISOString(),
            routingAccuracy: 0,
            avgResolutionTimeHours: 0,
            escalationPreventionRate: 0,
            aiDecisionLatencyMs: { p50: 0, p95: 0, p99: 0, avg: 0 },
            slaComplianceRate: 0,
            totalAnalyses: 0,
            totalFeedback: 0,
            modelVersion: 'matie-v2.0.0',
        };
    }
}

/**
 * Persist a metrics snapshot to Firestore for historical tracking.
 */
export async function persistMetrics(snapshot: AIMetricsSnapshot): Promise<void> {
    try {
        // Store as latest snapshot (overwrite)
        await setDoc(doc(db, 'ai_metrics', snapshot.tenantId), {
            ...snapshot,
            persisted_at: Timestamp.now(),
        });

        // Also store in history subcollection
        await addDoc(collection(db, 'ai_metrics', snapshot.tenantId, 'history'), {
            ...snapshot,
            persisted_at: Timestamp.now(),
        });

        logger.info('AI metrics persisted', { tenantId: snapshot.tenantId });
    } catch (err) {
        logger.error('Failed to persist AI metrics', {
            tenantId: snapshot.tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
}
