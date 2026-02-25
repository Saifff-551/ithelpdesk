/**
 * MATIE — AI Audit Log
 * 
 * Immutable audit trail for all MATIE AI decisions. Every ticket analysis
 * result is persisted to Firestore for compliance, explainability, and
 * weight recalibration.
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../logger';
import type { MATIEAnalysis, RoutingFeedback, EscalationAuditEntry, MFISWeights } from './types';

// ============================================
// AI Decision Persistence
// ============================================

/**
 * Store a MATIE analysis result as an immutable audit log entry.
 */
export async function logAnalysis(
    tenantId: string,
    analysis: MATIEAnalysis
): Promise<string | null> {
    try {
        const docRef = await addDoc(collection(db, 'matie_analyses'), {
            tenant_id: tenantId,
            ticket_id: analysis.ticketId,
            timestamp: Timestamp.now(),
            recommended_agent_id: analysis.recommendedAgentId,
            recommended_priority: analysis.recommendedPriority,
            ai_confidence: analysis.aiConfidence,
            processing_time_ms: analysis.processingTimeMs,
            escalation_probability: analysis.escalation.probability,
            escalation_risk_level: analysis.escalation.riskLevel,
            sentiment_score: analysis.escalation.sentiment.score,
            sentiment_label: analysis.escalation.sentiment.label,
            agent_rankings_count: analysis.agentRankings.length,
            top_agent_score: analysis.agentRankings[0]?.finalScore || 0,
            top_agent_confidence: analysis.agentRankings[0]?.confidence || 0,
            insights: analysis.insights,
            // Store factor breakdown for top agent (explainability)
            top_agent_factors: analysis.agentRankings[0]?.factors || null,
            should_auto_escalate: analysis.escalation.shouldAutoEscalate,
            // Explainability report (patent-grade traceability)
            explainability_report: analysis.explainabilityReport || null,
            model_version: analysis.modelVersion || 'unknown',
            // Trend signals from escalation engine
            trend_signals: analysis.escalation.trendSignals || [],
            sentiment_confidence: analysis.escalation.sentimentConfidence || 0,
        });

        logger.info('MATIE analysis logged to audit trail', {
            tenantId,
            ticketId: analysis.ticketId,
            docId: docRef.id,
        });

        return docRef.id;
    } catch (err) {
        logger.error('Failed to log MATIE analysis', {
            tenantId,
            ticketId: analysis.ticketId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return null;
    }
}

/**
 * Store routing feedback for weight recalibration.
 */
export async function logFeedback(
    tenantId: string,
    feedback: RoutingFeedback
): Promise<string | null> {
    try {
        const docRef = await addDoc(collection(db, 'matie_feedback'), {
            tenant_id: tenantId,
            ticket_id: feedback.ticketId,
            original_agent_id: feedback.originalAgentId,
            final_agent_id: feedback.finalAgentId,
            was_reassigned: feedback.wasReassigned,
            resolution_time_hours: feedback.resolutionTimeHours,
            customer_satisfaction: feedback.customerSatisfaction || null,
            sla_met: feedback.slaMet,
            timestamp: Timestamp.now(),
        });

        logger.info('Routing feedback logged', {
            tenantId,
            ticketId: feedback.ticketId,
            wasReassigned: feedback.wasReassigned,
            docId: docRef.id,
        });

        return docRef.id;
    } catch (err) {
        logger.error('Failed to log routing feedback', {
            tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return null;
    }
}

// ============================================
// Audit Trail Queries
// ============================================

/**
 * Retrieve recent MATIE analyses for a tenant (dashboard display).
 */
export async function getRecentAnalyses(
    tenantId: string,
    maxResults: number = 20
): Promise<Array<Record<string, unknown>>> {
    try {
        const q = query(
            collection(db, 'matie_analyses'),
            where('tenant_id', '==', tenantId),
            orderBy('timestamp', 'desc'),
            limit(maxResults)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || '',
        }));
    } catch (err) {
        logger.error('Failed to fetch recent analyses', {
            tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return [];
    }
}

/**
 * Get routing accuracy from actual feedback data (replaces Math.random).
 */
export async function getRoutingAccuracy(tenantId: string): Promise<number> {
    try {
        const q = query(
            collection(db, 'matie_feedback'),
            where('tenant_id', '==', tenantId),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return 0;

        const notReassigned = snapshot.docs.filter(d => !d.data().was_reassigned).length;
        return notReassigned / snapshot.docs.length;
    } catch {
        return 0;
    }
}

// ============================================
// Escalation Prediction Audit
// ============================================

/**
 * Store an escalation prediction as an immutable audit entry.
 * Every prediction is logged for compliance and trend analysis.
 */
export async function logEscalationPrediction(
    entry: EscalationAuditEntry
): Promise<string | null> {
    try {
        const docRef = await addDoc(collection(db, 'matie_escalation_predictions'), {
            tenant_id: entry.tenantId,
            ticket_id: entry.ticketId,
            timestamp: Timestamp.now(),
            probability: entry.probability,
            risk_level: entry.riskLevel,
            sentiment_score: entry.sentimentScore,
            sentiment_label: entry.sentimentLabel,
            sentiment_confidence: entry.sentimentConfidence,
            trigger_factors: entry.triggerFactors,
            trend_signals: entry.trendSignals.map(ts => ({
                signal: ts.signal,
                direction: ts.direction,
                strength: ts.strength,
                description: ts.description,
            })),
            is_repeat_complaint: entry.isRepeatComplaint,
            model_version: entry.modelVersion,
        });

        logger.info('Escalation prediction logged to audit trail', {
            tenantId: entry.tenantId,
            ticketId: entry.ticketId,
            probability: entry.probability.toFixed(4),
            riskLevel: entry.riskLevel,
            docId: docRef.id,
        });

        return docRef.id;
    } catch (err) {
        logger.error('Failed to log escalation prediction', {
            tenantId: entry.tenantId,
            ticketId: entry.ticketId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return null;
    }
}

// ============================================
// Tenant Config (Firestore-Stored Weights)
// ============================================

/**
 * Load tenant-specific MFIS weights from Firestore.
 * Returns null if no custom config exists (use defaults).
 */
export async function loadTenantWeights(
    tenantId: string
): Promise<MFISWeights | null> {
    try {
        const docRef = doc(db, 'matie_config', tenantId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        if (!data?.mfis_weights) return null;

        const w = data.mfis_weights;
        return {
            expertiseMatch: Number(w.expertiseMatch) || 0.30,
            sentimentScore: Number(w.sentimentScore) || 0.15,
            workloadIndex: Number(w.workloadIndex) || 0.20,
            slaUrgencyWeight: Number(w.slaUrgencyWeight) || 0.20,
            escalationProbability: Number(w.escalationProbability) || 0.15,
        };
    } catch (err) {
        logger.error('Failed to load tenant weights', {
            tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return null;
    }
}

/**
 * Persist recalibrated MFIS weights back to Firestore.
 */
export async function saveTenantWeights(
    tenantId: string,
    weights: MFISWeights
): Promise<boolean> {
    try {
        const docRef = doc(db, 'matie_config', tenantId);
        await setDoc(docRef, {
            mfis_weights: weights,
            updated_at: Timestamp.now(),
            tenant_id: tenantId,
        }, { merge: true });

        logger.info('Tenant weights persisted to Firestore', {
            tenantId,
            weights,
        });

        return true;
    } catch (err) {
        logger.error('Failed to save tenant weights', {
            tenantId,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        return false;
    }
}
