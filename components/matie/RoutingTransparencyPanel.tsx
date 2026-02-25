import React from 'react';
import { MFISFactors, MFISWeights } from '../../services/matie/types';

interface TransparencyProps {
    factors: MFISFactors;
    weights: MFISWeights;
    confidence: number;
    auditTraceId: string;
}

export const RoutingTransparencyPanel: React.FC<TransparencyProps> = ({ factors, weights, confidence, auditTraceId }) => {
    // Patent defensibility: Display Raw Factor * Weight = Contribution
    const renderRow = (label: string, factor: number, weight: number) => {
        const contribution = factor * weight;
        return (
            <div className="flex justify-between items-center text-xs py-1 border-b border-border-default/50 last:border-0 hover:bg-surface-3 transition-colors duration-fast">
                <span className="text-gray-400 w-1/3">{label}</span>
                <span className="text-gray-500 font-mono w-1/6 text-right" title="Raw Factor">{factor.toFixed(2)}</span>
                <span className="text-gray-600 w-1/6 text-center">×</span>
                <span className="text-status-info font-mono w-1/6 text-right" title="Weight">{weight.toFixed(2)}</span>
                <span className="text-gray-600 w-1/6 text-center">=</span>
                <span className="text-gray-300 font-mono w-1/6 text-right font-bold" title="Contribution">{contribution.toFixed(2)}</span>
            </div>
        );
    };

    const totalSignal = (
        factors.expertiseMatch * weights.w_expertise +
        factors.availabilityScore * weights.w_availability +
        factors.historicalSuccess * weights.w_historical +
        factors.urgencyMultiplier * weights.w_urgency
    );

    return (
        <div className="bg-surface-2 border border-border-strong rounded-lg p-4 font-mono text-sm shadow-card">
            <div className="flex justify-between items-center mb-4 border-b border-border-strong pb-2">
                <h3 className="text-gray-200 font-semibold tracking-wide">MATIE MFIS Engine</h3>
                <span className={`px-2 py-1 rounded text-xs border ${confidence > 0.8 ? 'bg-status-operational/10 text-status-operational border-status-operational/30' : 'bg-status-warning/10 text-status-warning border-status-warning/30'}`}>
                    Confidence: {Math.round(confidence * 100)}%
                </span>
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2 px-1">
                <span className="w-1/3">Metric</span>
                <span className="w-1/6 text-right">Raw</span>
                <span className="w-1/6 text-center"></span>
                <span className="w-1/6 text-right">Weight</span>
                <span className="w-1/6 text-center"></span>
                <span className="w-1/6 text-right">Contrib</span>
            </div>

            <div className="space-y-1">
                {renderRow('Expertise Match', factors.expertiseMatch, weights.w_expertise)}
                {renderRow('Availability', factors.availabilityScore, weights.w_availability)}
                {renderRow('Historical Success', factors.historicalSuccess, weights.w_historical)}
                {renderRow('Urgency Multiplier', factors.urgencyMultiplier, weights.w_urgency)}

                <div className="flex justify-between items-center text-xs py-2 border-t border-border-strong mt-2">
                    <span className="text-gray-300 font-bold">Total MFIS Signal (Σ)</span>
                    <span className="text-gray-200 font-mono font-bold">{totalSignal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-status-info text-[10px] uppercase">Sigmoid Normalized</span>
                    <span className="text-status-operational font-mono font-bold">{confidence.toFixed(4)}</span>
                </div>
            </div>

            <div className="mt-4 pt-2 border-t border-border-strong text-xs text-gray-600 flex justify-between">
                <span>Trace ID: {auditTraceId || 'N/A'}</span>
                <span className="text-primary hover:underline cursor-pointer transition-colors duration-fast">View full audit →</span>
            </div>
        </div>
    );
};
