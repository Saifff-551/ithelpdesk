import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Maximize2,
    Home,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================
// Slide 1 — Title Slide
// ============================================================
const TitleSlide: React.FC = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#5e2b97] via-[#7b1fa2] to-[#6a1b9a] relative flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 20% 30%, rgba(225,190,231,0.18), transparent 55%),
                   radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%)`
        }} />
        <div className="absolute w-[520px] h-[520px] -top-60 -right-48 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)]" />
        <div className="absolute w-[420px] h-[420px] -bottom-52 -left-40 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)]" />
        <div className="absolute w-[260px] h-[260px] top-24 left-[18%] rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)] opacity-40" />

        <div className="relative z-10 text-center px-12 lg:px-24">
            {/* Icon row */}
            <div className="flex justify-center gap-4 mb-8 opacity-90">
                <span className="material-icons text-white text-4xl">psychology</span>
                <span className="material-icons text-white text-4xl">hub</span>
                <span className="material-icons text-white text-4xl">support_agent</span>
            </div>

            <h1 className="text-white text-[42px] lg:text-[56px] font-bold leading-tight max-w-5xl mx-auto mb-4">
                MATIE
            </h1>
            <p className="text-white/90 text-[22px] lg:text-[28px] font-light leading-relaxed max-w-4xl mx-auto mb-3">
                MetaMinds Adaptive Ticket Intelligence Engine
            </p>

            <div className="mx-auto mb-6 h-[3px] w-64 bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <p className="text-white/80 text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-10">
                Adaptive AI Infrastructure for Enterprise IT Operations
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                {[
                    { icon: 'route', label: 'Adaptive Routing' },
                    { icon: 'visibility', label: 'Explainable AI' },
                    { icon: 'trending_up', label: 'Self-Learning' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                        <span className="material-icons text-white text-lg">{item.icon}</span>
                        <span className="text-white text-sm font-medium">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <p className="text-white/70 text-base italic">
                    "Transforming IT Support with Explainable AI Routing"
                </p>
            </div>

            <div className="absolute bottom-8 inset-x-0">
                <p className="text-white/85 text-base tracking-wide">
                    Presented by <span className="font-semibold">MetaMinds</span> ·
                    <span className="font-light"> CSE (Artificial Intelligence &amp; Machine Learning)</span>
                </p>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 2 — The Problem
// ============================================================
const ProblemSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">The Problem</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-3/5 px-12 lg:px-16 py-10 flex flex-col justify-center space-y-5">
                <h2 className="text-[#6A1B9A] text-[24px] font-bold mb-2">Enterprise IT Support Problems</h2>
                {[
                    { icon: 'schedule', title: 'Ticket Delays', desc: 'Reduce employee productivity and satisfaction.' },
                    { icon: 'balance', title: 'Manual Assignment', desc: 'Causes workload imbalance across support agents.' },
                    { icon: 'visibility_off', title: 'Lack of Visibility', desc: 'No real-time insights into support performance.' },
                    { icon: 'warning', title: 'Late Escalations', desc: 'Escalations happen after the damage is done.' },
                    { icon: 'lock', title: 'No AI Transparency', desc: 'Traditional helpdesks use black-box decision making.' },
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <span className="material-icons text-[#6A1B9A] text-[28px] mt-0.5">{item.icon}</span>
                        <div>
                            <h3 className="text-[#6A1B9A] font-semibold text-[18px] mb-0.5">{item.title}</h3>
                            <p className="text-gray-700 text-[16px] leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-2/5 py-10 pr-12 flex items-center">
                <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-purple-100 to-purple-50 p-8 flex flex-col items-center justify-center gap-3">
                    <p className="text-[#6A1B9A] text-lg font-semibold mb-4">Typical IT Support Flow</p>
                    {['Employee', 'Ticket', 'Manual Assignment', 'Delays', 'Escalation'].map((step, i) => (
                        <React.Fragment key={i}>
                            <div className="bg-white rounded-xl shadow-md px-6 py-3 border border-purple-200 w-full text-center">
                                <span className="text-[#6A1B9A] font-medium text-[16px]">{step}</span>
                            </div>
                            {i < 4 && <span className="material-icons text-[#6A1B9A] text-2xl">arrow_downward</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 3 — Limitations of Existing Systems
// ============================================================
const LimitationsSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Limitations of Existing Systems</h1>
        </div>

        <div className="h-[calc(100%-85px)] flex flex-col justify-center px-16">
            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
                {[
                    { system: 'Traditional Helpdesk', limitation: 'Static ticket routing', icon: 'desktop_windows', color: '#ef4444' },
                    { system: 'Chatbots', limitation: 'Limited context understanding', icon: 'smart_toy', color: '#f59e0b' },
                    { system: 'AI Automation Tools', limitation: 'Black-box decisions', icon: 'memory', color: '#f97316' },
                    { system: 'Ticketing Systems', limitation: 'No predictive escalation', icon: 'confirmation_number', color: '#6b7280' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-xl border-2 border-red-200 bg-red-50">
                        <span className="material-icons text-3xl" style={{ color: item.color }}>{item.icon}</span>
                        <div>
                            <h3 className="font-semibold text-[18px] text-gray-800">{item.system}</h3>
                            <p className="text-gray-600 text-[16px]">{item.limitation}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <span className="material-icons text-[#6A1B9A] text-4xl mb-2">lightbulb</span>
                <p className="text-[#6A1B9A] text-[20px] font-semibold">
                    Current systems <span className="text-red-500">react</span> to problems. MATIE <span className="text-green-600">predicts and optimizes</span> them.
                </p>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 4 — Introducing MATIE
// ============================================================
const IntroducingMATIESlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Introducing MATIE</h1>
        </div>

        <div className="h-[calc(100%-85px)] flex flex-col justify-center px-16">
            {/* Title */}
            <div className="text-center mb-10">
                <div className="inline-block px-10 py-6 rounded-2xl border border-purple-200 bg-purple-50">
                    <span className="material-icons text-[#6A1B9A] text-[48px] mb-2">psychology</span>
                    <h2 className="text-[#6A1B9A] text-[36px] font-bold">MATIE = Adaptive AI Routing Engine</h2>
                </div>
            </div>

            {/* Capabilities */}
            <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
                {[
                    { icon: 'route', title: 'Intelligent Routing', desc: 'Optimal agent assignment' },
                    { icon: 'trending_up', title: 'Predictive Escalation', desc: 'Detect before it happens' },
                    { icon: 'auto_fix_high', title: 'Self-Learning', desc: 'Workload optimization' },
                    { icon: 'visibility', title: 'Explainable AI', desc: 'Transparent decision logic' },
                    { icon: 'account_tree', title: 'Multi-Tenant', desc: 'Enterprise architecture' },
                    { icon: 'speed', title: 'Real-Time', desc: 'Sub-200ms routing' },
                ].map((item, i) => (
                    <div key={i} className="p-5 rounded-xl border border-purple-200 bg-white text-center shadow-sm">
                        <span className="material-icons text-[#6A1B9A] text-[36px] mb-2">{item.icon}</span>
                        <h3 className="text-[#6A1B9A] font-semibold text-[17px] mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-[15px]">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Architecture Flow */}
            <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
                {['Ticket Input', 'NLP Analysis', 'MFIS Engine', 'Escalation Prediction', 'Agent Ranking', 'Adaptive Routing'].map((step, i) => (
                    <React.Fragment key={i}>
                        <div className="bg-gradient-to-br from-[#6A1B9A] to-[#7B1FA2] rounded-lg px-3 py-2 text-white text-[12px] font-medium shadow-md text-center min-w-[90px]">
                            {step}
                        </div>
                        {i < 5 && <span className="material-icons text-[#6A1B9A] text-xl">arrow_forward</span>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 5 — Core Innovation (MFIS Algorithm)
// ============================================================
const MFISSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Core Innovation — MFIS Algorithm</h1>
        </div>

        <div className="h-[calc(100%-85px)] flex flex-col justify-center px-16">
            <div className="max-w-5xl mx-auto w-full">
                {/* Formula */}
                <div className="bg-[#0d0a12] rounded-2xl p-8 mb-8 shadow-xl">
                    <h2 className="text-purple-300 text-[22px] font-bold mb-4 flex items-center gap-2">
                        <span className="material-icons text-[28px]">functions</span>
                        Multi-Factor Intelligence Scoring (MFIS)
                    </h2>
                    <div className="font-mono text-[15px] text-gray-300 bg-black/40 rounded-xl p-6 leading-loose">
                        <span className="text-purple-400 font-bold">Final Score</span> ={' '}
                        <span className="text-indigo-300">(W₁ × Expertise Match)</span> +{' '}
                        <span className="text-blue-300">(W₂ × Sentiment Score)</span> +{' '}
                        <span className="text-cyan-300">(W₃ × Workload Index)</span> +{' '}
                        <span className="text-teal-300">(W₄ × SLA Urgency)</span> +{' '}
                        <span className="text-emerald-300">(W₅ × Escalation Probability)</span>
                        <br /><br />
                        <span className="text-pink-400">Then:</span>{' '}
                        <span className="text-amber-300">Sigmoid Normalization → Final Ranking</span>
                    </div>
                </div>

                {/* Weight Cards */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    {[
                        { label: 'Expertise', weight: '0.30', color: 'from-indigo-500 to-indigo-600' },
                        { label: 'Sentiment', weight: '0.15', color: 'from-blue-500 to-blue-600' },
                        { label: 'Workload', weight: '0.20', color: 'from-cyan-500 to-cyan-600' },
                        { label: 'SLA', weight: '0.20', color: 'from-teal-500 to-teal-600' },
                        { label: 'Escalation', weight: '0.15', color: 'from-emerald-500 to-emerald-600' },
                    ].map((item, i) => (
                        <div key={i} className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-center text-white shadow-md`}>
                            <p className="text-[28px] font-black">{item.weight}</p>
                            <p className="text-sm font-medium opacity-90">W{i + 1} · {item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Key Properties */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: 'tune', title: 'Dynamic Weights', desc: 'Adapts to routing success over time' },
                        { icon: 'visibility', title: 'Explainable Factors', desc: 'Every score is traceable' },
                        { icon: 'autorenew', title: 'Adaptive Recalibration', desc: 'Self-learning feedback loop' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <span className="material-icons text-[#6A1B9A] text-[24px] mt-0.5">{item.icon}</span>
                            <div>
                                <h4 className="text-[#6A1B9A] font-semibold text-[15px]">{item.title}</h4>
                                <p className="text-gray-600 text-[13px]">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 6 — Explainable AI (Trust Layer)
// ============================================================
const ExplainableAISlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Explainable AI — Trust Layer</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-1/2 px-12 py-10 flex flex-col justify-center">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-icons text-[#6A1B9A] text-4xl">visibility</span>
                        <h2 className="text-[28px] font-bold text-[#6A1B9A]">Why This Decision?</h2>
                    </div>
                    <div className="w-24 h-1 bg-[#6A1B9A]" />
                </div>

                <p className="text-gray-700 text-[17px] leading-relaxed mb-6">
                    Most AI tools are <span className="font-bold text-red-500">black boxes</span>. 
                    MATIE shows <span className="font-bold text-green-600">exactly why</span> a decision happened — making every routing choice transparent and auditable.
                </p>

                <div className="space-y-3">
                    {[
                        { icon: 'verified', text: 'AI Transparency', desc: 'Every factor visible to managers' },
                        { icon: 'policy', text: 'Auditability', desc: 'Immutable decision logs' },
                        { icon: 'handshake', text: 'Trust in Automation', desc: 'Teams understand and trust AI' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <span className="material-icons text-[#6A1B9A] text-xl">{item.icon}</span>
                            <div>
                                <span className="text-[#6A1B9A] font-semibold text-[16px]">{item.text}</span>
                                <p className="text-gray-500 text-[13px]">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-1/2 py-10 pr-12 flex items-center">
                <div className="w-full bg-[#0d0a12] rounded-2xl p-6 shadow-2xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                        <span className="ml-3 text-xs text-gray-400 font-mono">MATIE Decision Report — TK-4521</span>
                    </div>
                    <div className="font-mono text-[14px] leading-loose space-y-1">
                        <div className="flex justify-between text-gray-300">
                            <span>Expertise Match</span>
                            <span><span className="text-cyan-400">0.92</span> × <span className="text-purple-400">0.25</span> = <span className="text-green-400 font-bold">0.23</span></span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Availability</span>
                            <span><span className="text-cyan-400">0.70</span> × <span className="text-purple-400">0.20</span> = <span className="text-green-400 font-bold">0.14</span></span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Historical Success</span>
                            <span><span className="text-cyan-400">0.85</span> × <span className="text-purple-400">0.20</span> = <span className="text-green-400 font-bold">0.17</span></span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Urgency Multiplier</span>
                            <span><span className="text-cyan-400">0.60</span> × <span className="text-purple-400">0.15</span> = <span className="text-green-400 font-bold">0.09</span></span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Escalation Risk</span>
                            <span><span className="text-cyan-400">0.55</span> × <span className="text-purple-400">0.20</span> = <span className="text-green-400 font-bold">0.11</span></span>
                        </div>
                        <div className="border-t border-gray-600 my-2 pt-2 flex justify-between text-white font-bold text-[16px]">
                            <span>Total Score</span>
                            <span className="text-amber-400 text-[20px]">0.74</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 7 — System Architecture
// ============================================================
const ArchitectureSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">System Architecture</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-[55%] px-12 py-8 flex flex-col justify-center">
                <h2 className="text-[#6A1B9A] text-[26px] font-bold mb-6">MATIE Infrastructure Stack</h2>
                <div className="flex flex-col gap-3">
                    {[
                        { name: 'Frontend', tech: 'React + TypeScript Control Plane', color: '#c4b5fd', icon: 'web' },
                        { name: 'Backend', tech: 'Node.js + API Layer', color: '#a78bfa', icon: 'dns' },
                        { name: 'AI Engine', tech: 'MFIS + Escalation Prediction', color: '#8b5cf6', icon: 'psychology' },
                        { name: 'Data Layer', tech: 'Firestore / Redis', color: '#7c3aed', icon: 'storage' },
                        { name: 'Cloud Layer', tech: 'Async Worker Queue', color: '#6d28d9', icon: 'cloud' },
                    ].map((layer, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 rounded-xl text-white shadow-md" style={{ backgroundColor: layer.color }}>
                            <span className="material-icons text-3xl">{layer.icon}</span>
                            <div>
                                <h3 className="text-xl font-bold">{layer.name}</h3>
                                <p className="text-white/90 text-[15px]">{layer.tech}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-[45%] py-8 pr-12 flex items-center">
                <div className="w-full rounded-2xl bg-gradient-to-br from-purple-50 to-white border-2 border-[#E1BEE7] p-8 shadow-xl">
                    <h3 className="text-[#6A1B9A] text-[20px] font-bold mb-6 text-center">Enterprise Features</h3>
                    <div className="space-y-4">
                        {[
                            { icon: 'shield', title: 'Multi-Tenant Isolation', desc: 'Complete data separation per organization' },
                            { icon: 'sync', title: 'Async Routing', desc: 'Non-blocking ticket processing pipeline' },
                            { icon: 'memory', title: 'Circuit Breakers', desc: 'Resilient AI service architecture' },
                            { icon: 'speed', title: 'Sub-200ms Latency', desc: 'Real-time routing decisions at scale' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-[#6A1B9A] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="material-icons text-white text-xl">{item.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-[#6A1B9A] font-semibold text-[16px]">{item.title}</h4>
                                    <p className="text-gray-600 text-[14px]">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 8 — Observability Control Plane
// ============================================================
const ObservabilitySlide: React.FC = () => (
    <div className="w-full h-full bg-[#0d0a12] text-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Observability Control Plane</h1>
        </div>

        <div className="h-[calc(100%-85px)] flex flex-col justify-center px-16">
            {/* Metric Cards */}
            <div className="grid grid-cols-4 gap-5 mb-8 max-w-5xl mx-auto w-full">
                {[
                    { label: 'System Health', value: '99.9%', icon: 'monitor_heart', color: '#22c55e' },
                    { label: 'AI Routing Accuracy', value: '94.2%', icon: 'psychology', color: '#8b5cf6' },
                    { label: 'Queue Depth', value: '12', icon: 'queue', color: '#3b82f6' },
                    { label: 'Agent Workload', value: 'Balanced', icon: 'groups', color: '#f59e0b' },
                ].map((item, i) => (
                    <div key={i} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 text-center">
                        <span className="material-icons text-3xl mb-2" style={{ color: item.color }}>{item.icon}</span>
                        <p className="text-[26px] font-black" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-gray-400 text-sm mt-1">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Dashboard Features */}
            <div className="max-w-5xl mx-auto w-full">
                <h3 className="text-purple-300 text-[18px] font-bold mb-4">Real-Time Monitoring Features</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: 'analytics', title: 'AI Routing Accuracy Metrics', desc: 'Track ML model performance in real-time' },
                        { icon: 'trending_down', title: 'Escalation Prevention Rate', desc: 'Measure proactive intervention success' },
                        { icon: 'verified', title: 'SLA Compliance Tracking', desc: 'Real-time SLA adherence monitoring' },
                        { icon: 'timer', title: 'P50 / P95 / P99 Latency', desc: 'Full latency distribution monitoring' },
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 flex items-start gap-3">
                            <span className="material-icons text-purple-400 text-2xl mt-0.5">{item.icon}</span>
                            <div>
                                <h4 className="text-white font-semibold text-[15px]">{item.title}</h4>
                                <p className="text-gray-400 text-[13px]">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 9 — Patent Innovation
// ============================================================
const PatentSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Patent Innovation</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-1/2 px-12 py-10 flex flex-col justify-center">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-icons text-[#6A1B9A] text-4xl">workspace_premium</span>
                        <h2 className="text-[28px] font-bold text-[#6A1B9A]">Adaptive AI Routing Architecture</h2>
                    </div>
                    <div className="w-24 h-1 bg-[#6A1B9A]" />
                </div>

                <p className="text-gray-700 text-[17px] leading-relaxed mb-6">
                    MATIE's architecture represents a novel approach to intelligent ticket routing that is defensible as intellectual property.
                </p>

                <div className="space-y-4">
                    <h3 className="text-[#6A1B9A] font-bold text-[18px]">Key Patent Claims</h3>
                    {[
                        'MFIS weighted routing model',
                        'Sigmoid-normalized decision engine',
                        'Explainable AI routing trace',
                        'Multi-tenant adaptive recalibration',
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <span className="material-icons text-[#6A1B9A] text-xl">gavel</span>
                            <span className="text-gray-800 text-[16px] font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-1/2 py-10 pr-12 flex items-center">
                <div className="w-full rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 p-8 shadow-2xl text-white">
                    <h3 className="text-purple-200 text-[22px] font-bold mb-6 text-center">Enterprise Value</h3>
                    
                    <div className="space-y-6">
                        <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-icons text-amber-300 text-2xl">shield</span>
                                <h4 className="text-white font-bold text-[18px]">Defensible AI Infrastructure</h4>
                            </div>
                            <p className="text-purple-200 text-[14px] leading-relaxed">
                                Novel algorithmic approach protected by patent claims, creating a strong competitive moat.
                            </p>
                        </div>

                        <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-icons text-amber-300 text-2xl">precision_manufacturing</span>
                                <h4 className="text-white font-bold text-[18px]">Enterprise-Grade Decision Engine</h4>
                            </div>
                            <p className="text-purple-200 text-[14px] leading-relaxed">
                                Production-ready scoring engine with explainability, auditability, and compliance built-in.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Slide 10 — Impact & Future Vision
// ============================================================
const ImpactSlide: React.FC = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#5e2b97] via-[#7b1fa2] to-[#6a1b9a] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 20% 30%, rgba(225,190,231,0.18), transparent 55%),
                   radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%)`
        }} />
        <div className="absolute w-[520px] h-[520px] -top-60 -right-48 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.15)] to-[rgba(255,255,255,0.05)]" />
        <div className="absolute w-[420px] h-[420px] -bottom-52 -left-40 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.15)] to-[rgba(255,255,255,0.05)]" />

        <div className="relative z-10 text-center px-12 lg:px-24 max-w-5xl">
            <h1 className="text-white text-[44px] font-bold mb-10">Impact & Future Vision</h1>

            {/* Impact Metrics */}
            <div className="grid grid-cols-4 gap-5 mb-12">
                {[
                    { value: '40%', label: 'Faster Resolution', icon: 'speed' },
                    { value: '78%', label: 'Escalation Prevention', icon: 'trending_down' },
                    { value: '94%', label: 'Routing Accuracy', icon: 'gps_fixed' },
                    { value: '96%', label: 'SLA Compliance', icon: 'verified' },
                ].map((item, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                        <span className="material-icons text-white/80 text-3xl mb-2">{item.icon}</span>
                        <p className="text-white text-[32px] font-black">{item.value}</p>
                        <p className="text-white/70 text-sm">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Future Roadmap */}
            <h3 className="text-white/90 text-[20px] font-semibold mb-4">Future Roadmap</h3>
            <div className="flex justify-center gap-4 mb-10">
                {[
                    'Enterprise Pilot Deployments',
                    'Reinforcement Learning',
                    'Cross-Platform AI Infrastructure',
                ].map((item, i) => (
                    <span key={i} className="bg-white/15 backdrop-blur rounded-full px-5 py-2 text-white text-sm border border-white/20">
                        {item}
                    </span>
                ))}
            </div>

            <div className="mx-auto h-[2px] w-48 bg-gradient-to-r from-transparent via-white/50 to-transparent mb-6" />

            <p className="text-white/90 text-[20px] font-light leading-relaxed italic">
                "MATIE is not just a helpdesk tool —<br />
                it is the <span className="font-bold">AI control plane</span> for enterprise IT operations."
            </p>

            <div className="absolute bottom-8 inset-x-0">
                <p className="text-white/70 text-sm">
                    <span className="font-semibold">MetaMinds</span> · CSE (AI & ML) · Thank You
                </p>
            </div>
        </div>
    </div>
);

// ============================================================
// All slides array
// ============================================================
const slideComponents = [
    TitleSlide,
    ProblemSlide,
    LimitationsSlide,
    IntroducingMATIESlide,
    MFISSlide,
    ExplainableAISlide,
    ArchitectureSlide,
    ObservabilitySlide,
    PatentSlide,
    ImpactSlide,
];

const slideNames = [
    'Title',
    'The Problem',
    'Existing Limitations',
    'Introducing MATIE',
    'MFIS Algorithm',
    'Explainable AI',
    'System Architecture',
    'Observability',
    'Patent Innovation',
    'Impact & Future',
];

// ============================================================
// Main Pitch Deck Component
// ============================================================
export const PitchPage: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slideComponents.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slideComponents.length) % slideComponents.length);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
            if (e.key === 'Escape') setIsFullscreen(false);
            if (e.key === 'f' || e.key === 'F') setIsFullscreen((prev) => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [isPlaying, nextSlide]);

    const SlideComponent = slideComponents[currentSlide];

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-100 flex flex-col`}>
            {/* Material Icons */}
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

            {/* Toolbar */}
            <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
                        <Home className="w-5 h-5 text-gray-600" />
                    </Link>
                    <span className="text-sm text-gray-500">
                        Slide {currentSlide + 1} of {slideComponents.length}: <span className="font-medium text-[#6A1B9A]">{slideNames[currentSlide]}</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-gray-100 rounded-lg" title={isPlaying ? 'Pause' : 'Auto-play'}>
                        {isPlaying ? <Pause className="w-5 h-5 text-gray-600" /> : <Play className="w-5 h-5 text-gray-600" />}
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-gray-100 rounded-lg" title="Fullscreen (F)">
                        <Maximize2 className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Slide Container */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl aspect-video rounded-2xl shadow-2xl overflow-hidden">
                    <SlideComponent />
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-center gap-4">
                <button onClick={prevSlide} className="p-2 hover:bg-gray-100 rounded-lg" disabled={currentSlide === 0}>
                    <ChevronLeft className={`w-6 h-6 ${currentSlide === 0 ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>

                <div className="flex gap-1">
                    {slideComponents.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-[#6A1B9A]' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            title={slideNames[i]}
                        />
                    ))}
                </div>

                <button onClick={nextSlide} className="p-2 hover:bg-gray-100 rounded-lg" disabled={currentSlide === slideComponents.length - 1}>
                    <ChevronRight className={`w-6 h-6 ${currentSlide === slideComponents.length - 1 ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
            </div>
        </div>
    );
};
