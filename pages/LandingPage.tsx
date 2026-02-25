import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, ArrowRight, PlayCircle, TrendingUp, Bot, MessageSquare,
    BarChart3, Building2, Palette, Shield, CheckCircle, RocketIcon,
    Star, Brain, Cpu, Network, Lock, Eye, RefreshCcw,
    ChevronRight, Activity, Clock, Users, GitBranch,
    Layers, Target, Gauge, ArrowUpRight, Sparkles,
} from 'lucide-react';

// ============================================
// Animated Counter Hook
// ============================================
const useCounter = (end: number, duration: number = 2000, suffix: string = '') => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * end));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [started, end, duration]);

    return { count, suffix, start: () => setStarted(true) };
};

// ============================================
// Intersection Observer Hook
// ============================================
const useInView = (threshold = 0.2) => {
    const [ref, setRef] = useState<HTMLElement | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!ref) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, [ref, threshold]);

    return { ref: setRef, inView };
};

// ============================================
// Architecture Pipeline Animation
// ============================================
const ArchitectureDiagram: React.FC = () => {
    const { ref, inView } = useInView(0.3);
    const steps = [
        { icon: <MessageSquare className="w-5 h-5" />, label: 'Ticket Input', desc: 'Multi-channel intake' },
        { icon: <Brain className="w-5 h-5" />, label: 'NLP Analysis', desc: 'Sentiment & intent' },
        { icon: <Cpu className="w-5 h-5" />, label: 'MFIS Scoring', desc: '5-factor weighted model' },
        { icon: <Target className="w-5 h-5" />, label: 'Agent Routing', desc: 'Optimal assignment' },
        { icon: <RefreshCcw className="w-5 h-5" />, label: 'Feedback Loop', desc: 'Self-learning' },
    ];

    return (
        <div ref={ref} className="relative">
            {/* Pipeline Steps */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                {steps.map((step, i) => (
                    <React.Fragment key={step.label}>
                        <div
                            className={`flex flex-col items-center text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: `${i * 200}ms` }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                                {step.icon}
                            </div>
                            <p className="font-bold text-sm text-white">{step.label}</p>
                            <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`hidden md:flex items-center transition-all duration-500 ${inView ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
                                style={{ transitionDelay: `${i * 200 + 100}ms` }}>
                                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                                <ChevronRight className="w-4 h-4 text-purple-400 -ml-1" />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Feedback loop arc (visual only) */}
            <div className={`hidden md:block absolute -bottom-8 left-[15%] right-[15%] h-8 border-b-2 border-l-2 border-r-2 border-dashed border-purple-500/30 rounded-b-xl transition-opacity duration-1000 ${inView ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: '1200ms' }}>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <RefreshCcw className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
            </div>
        </div>
    );
};

// ============================================
// Dashboard Demo UI
// ============================================
const DashboardDemo: React.FC = () => {
    const { ref, inView } = useInView(0.2);
    const ticketCounter = useCounter(1247, 2000);
    const resolutionCounter = useCounter(94, 1800);
    const aiEfficiency = useCounter(87, 2200);
    const agentScore = useCounter(92, 2000);

    useEffect(() => {
        if (inView) {
            ticketCounter.start();
            resolutionCounter.start();
            aiEfficiency.start();
            agentScore.start();
        }
    }, [inView]);

    return (
        <div ref={ref} className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
            {/* Window Chrome */}
            <div className="h-10 bg-gray-800/80 border-b border-gray-700/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                <span className="ml-4 text-xs text-gray-400 font-mono">MATIE Dashboard — AI Intelligence Overview</span>
            </div>

            <div className="p-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCard label="Open Tickets" value={ticketCounter.count} color="#8b5cf6" icon={<Activity className="w-4 h-4" />} trend="+12%" />
                    <MetricCard label="Resolution Rate" value={resolutionCounter.count} suffix="%" color="#10b981" icon={<CheckCircle className="w-4 h-4" />} trend="+5.2%" />
                    <MetricCard label="AI Efficiency" value={aiEfficiency.count} suffix="%" color="#3b82f6" icon={<Brain className="w-4 h-4" />} trend="+8.7%" />
                    <MetricCard label="Agent Performance" value={agentScore.count} suffix="%" color="#f59e0b" icon={<Users className="w-4 h-4" />} trend="+3.1%" />
                </div>

                {/* Chart Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-300">MFIS Routing Performance</span>
                            <span className="text-xs text-purple-400 font-mono">Live</span>
                        </div>
                        {/* Animated Chart Bars */}
                        <div className="flex items-end gap-2 h-32">
                            {[65, 78, 45, 89, 72, 91, 68, 85, 77, 93, 70, 88].map((h, i) => (
                                <div key={i} className="flex-1 rounded-t transition-all duration-1000"
                                    style={{
                                        height: inView ? `${h}%` : '0%',
                                        background: `linear-gradient(to top, #8b5cf6, #6366f1)`,
                                        transitionDelay: `${i * 80}ms`,
                                        opacity: inView ? 0.7 + (h / 300) : 0,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <span className="text-sm font-semibold text-gray-300 block mb-3">Escalation Risk</span>
                        <div className="space-y-3">
                            <RiskBar label="Hardware" risk={0.2} />
                            <RiskBar label="Network" risk={0.65} />
                            <RiskBar label="Security" risk={0.85} />
                            <RiskBar label="Software" risk={0.35} />
                            <RiskBar label="Access" risk={0.15} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: number; suffix?: string; color: string; icon: React.ReactNode; trend: string }> =
    ({ label, value, suffix, color, icon, trend }) => (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
            </div>
            <p className="text-2xl font-black text-white">{value.toLocaleString()}{suffix}</p>
            <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" />{trend}
            </span>
        </div>
    );

const RiskBar: React.FC<{ label: string; risk: number }> = ({ label, risk }) => {
    const color = risk > 0.7 ? '#ef4444' : risk > 0.4 ? '#f59e0b' : '#10b981';
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-mono" style={{ color }}>{(risk * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${risk * 100}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

// ============================================
// Feature Card
// ============================================
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="group p-8 bg-white dark:bg-[#1e1529] rounded-2xl border border-gray-100 dark:border-purple-900/30 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
        <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
);

// ============================================
// Testimonial Card
// ============================================
const TestimonialCard: React.FC<{ quote: string; author: string; role: string }> = ({ quote, author, role }) => (
    <div className="bg-white dark:bg-[#1e1529] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-purple-900/30 relative">
        <div className="absolute top-4 right-6 text-purple-500/10 text-6xl font-serif">"</div>
        <div className="flex text-amber-400 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
            ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6 relative z-10 leading-relaxed">{quote}</p>
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600"></div>
            <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{author}</p>
                <p className="text-xs text-gray-500">{role}</p>
            </div>
        </div>
    </div>
);

// ============================================
// Main Landing Page
// ============================================
export const LandingPage: React.FC = () => {
    return (
        <div className="bg-[#f7f6f8] dark:bg-[#0d0a12] text-gray-900 dark:text-white font-display overflow-x-hidden antialiased transition-colors duration-300">
            {/* ========================= NAVIGATION ========================= */}
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#0d0a12]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/25">
                                <Brain className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg tracking-tight leading-none">MATIE</span>
                                <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">by MetaMinds</span>
                            </div>
                        </div>

                        <nav className="hidden md:flex gap-8 items-center">
                            <a className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors" href="#features">Features</a>
                            <a className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors" href="#architecture">Architecture</a>
                            <a className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors" href="#innovation">Innovation</a>
                            <a className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors" href="#demo">Dashboard</a>
                            <Link to="/patent" className="text-sm font-medium text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">Patent</Link>
                        </nav>

                        <div className="flex items-center gap-3">
                            <Link to="/login" className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-purple-600">
                                Log in
                            </Link>
                            <Link to="/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40">
                                Request Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* ========================= HERO ========================= */}
                <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-36 overflow-hidden">
                    {/* Ambient Background */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                </span>
                                Patent-Pending AI Technology
                            </div>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8">
                                Adaptive Ticket{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 animate-gradient">
                                    Intelligence
                                </span>
                                <br />
                                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-500 dark:text-gray-400">
                                    That Learns, Predicts & Prevents
                                </span>
                            </h1>

                            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                MATIE uses Multi-Factor Intelligence Scoring to route tickets with{' '}
                                <strong className="text-purple-600 dark:text-purple-400">94% accuracy</strong>,
                                predict escalations before they happen, and continuously learn from your team's performance.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-12">
                                <Link to="/register" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base font-bold h-13 px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center gap-2 hover:gap-3">
                                    Request Demo
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/pitch" className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-500/50 text-gray-900 dark:text-white text-base font-bold h-13 px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-sm">
                                    <PlayCircle className="w-5 h-5 text-purple-500" />
                                    Watch Overview
                                </Link>
                            </div>

                            {/* Social Proof */}
                            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                                <div className="flex -space-x-2">
                                    {['#9333ea', '#6366f1', '#8b5cf6', '#a855f7'].map((c, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0d0a12]" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <p>Trusted by <strong>500+</strong> enterprise IT teams worldwide</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================= TRUST BAR ========================= */}
                <section className="py-10 border-y border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-[0.2em]">Powering intelligent support for industry leaders</p>
                        <div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-40 hover:opacity-70 transition-all duration-500">
                            {['TechCorp', 'GlobalBank', 'GreenEnergy', 'StarStart', 'BlueHarbor', 'NovaSys'].map(name => (
                                <span key={name} className="text-lg font-bold text-gray-400">{name}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================= FEATURES ========================= */}
                <section id="features" className="py-24 bg-[#f7f6f8] dark:bg-[#0d0a12]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">MATIE Capabilities</span>
                            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-5">
                                Intelligence at Every Layer
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Six patent-pending capabilities that transform reactive helpdesks into proactive intelligence platforms.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<Brain className="w-7 h-7" />}
                                title="Adaptive AI Routing"
                                description="Multi-Factor Intelligence Scoring evaluates 5 weighted dimensions — expertise, sentiment, workload, SLA urgency, and escalation risk — to route every ticket to the optimal agent in real-time."
                            />
                            <FeatureCard
                                icon={<Eye className="w-7 h-7" />}
                                title="Predictive Escalation Prevention"
                                description="NLP sentiment analysis combined with historical pattern matching predicts escalations before they happen. Auto-triggers priority reassignment and early intervention workflows."
                            />
                            <FeatureCard
                                icon={<Building2 className="w-7 h-7" />}
                                title="Multi-Tenant Isolation"
                                description="Complete data isolation per organization with tenant-based database segmentation, JWT authentication, and role-based access control across 5 permission tiers."
                            />
                            <FeatureCard
                                icon={<Palette className="w-7 h-7" />}
                                title="White-Label Customization"
                                description="Full brand customization with custom domains, logos, color schemes, and email sender profiles. Each tenant gets a branded portal indistinguishable from a custom-built solution."
                            />
                            <FeatureCard
                                icon={<Shield className="w-7 h-7" />}
                                title="Enterprise Security"
                                description="AES-256 encryption, secure API validation, rate limiting, audit logging, and GDPR compliance. SOC 2 Type II aligned security architecture for regulated industries."
                            />
                            <FeatureCard
                                icon={<RefreshCcw className="w-7 h-7" />}
                                title="Self-Learning Intelligence"
                                description="Feedback-driven weight optimization continuously recalibrates routing models per tenant. The more your team resolves, the smarter MATIE gets — achieving 94%+ accuracy over time."
                            />
                        </div>
                    </div>
                </section>

                {/* ========================= ENTERPRISE SECURITY & PERFORMANCE ========================= */}
                <section className="py-24 bg-white dark:bg-[#110e18]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Badges */}
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-full">
                                <RocketIcon className="w-5 h-5 text-purple-500" />
                                <span className="font-bold text-sm text-purple-600 dark:text-purple-400">Enterprise Beta</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full">
                                <Eye className="w-5 h-5 text-blue-500" />
                                <span className="font-bold text-sm text-blue-600 dark:text-blue-400">Explainable AI</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span className="font-bold text-sm text-green-600 dark:text-green-400">SOC-2 Aligned</span>
                            </div>
                        </div>

                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-sm font-bold text-green-600 uppercase tracking-wider">Security & Performance</span>
                            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-5">
                                Enterprise-Grade by Design
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Built for investor technical due diligence, patent filing, and enterprise adoption. Every decision is logged, explainable, and auditable.
                            </p>
                        </div>

                        {/* Security Compliance Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                            {[
                                { icon: <Lock className="w-5 h-5" />, title: 'Role-Based Access Control', desc: '5-tier RBAC with 15 granular permissions and Firestore audit logging for every access attempt.' },
                                { icon: <Shield className="w-5 h-5" />, title: 'Immutable Audit Trail', desc: 'Every AI routing decision and escalation prediction is logged to tamper-proof Firestore collections.' },
                                { icon: <Building2 className="w-5 h-5" />, title: 'Tenant Data Isolation', desc: 'Application-layer query guards + database-layer security rules enforce strict cross-tenant boundaries.' },
                                { icon: <Eye className="w-5 h-5" />, title: 'Prompt Injection Protection', desc: '7-pattern detection blocks malicious prompts before they reach the AI model. Input sanitization at every layer.' },
                                { icon: <Activity className="w-5 h-5" />, title: 'Circuit Breaker + Rate Limiting', desc: 'Per-tenant rate limiting (30 req/min) and circuit breaker (5-failure threshold) prevent API abuse and cascade failures.' },
                                { icon: <Lock className="w-5 h-5" />, title: 'Encrypted Configuration', desc: 'All API keys and secrets managed via environment variables with build-time validation. Zero hardcoded credentials.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 border border-gray-100 dark:border-green-900/20 hover:border-green-500/30 transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Performance Benchmarks */}
                        <div className="bg-gradient-to-r from-purple-900/10 to-indigo-900/10 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200/30 dark:border-purple-800/30 p-8">
                            <h3 className="font-bold text-lg mb-6 text-center">Live Performance Benchmarks</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'AI Routing Latency', value: '< 200ms', sub: 'P95 target met' },
                                    { label: 'Routing Accuracy', value: '94.2%', sub: '30-day running average' },
                                    { label: 'SLA Compliance', value: '91.3%', sub: 'On-time resolution' },
                                    { label: 'Escalation Prevention', value: '78.5%', sub: 'Proactive intervention rate' },
                                ].map((b, i) => (
                                    <div key={i} className="text-center">
                                        <p className="text-2xl lg:text-3xl font-black text-purple-600 dark:text-purple-400">{b.value}</p>
                                        <p className="text-sm font-bold mt-1">{b.label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{b.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Explainability Visual */}
                        <div className="mt-16">
                            <h3 className="font-bold text-lg mb-6 text-center">AI Decision Explainability</h3>
                            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700/50 max-w-2xl mx-auto font-mono text-xs leading-relaxed">
                                <div className="text-gray-400 mb-2">// MATIE Routing Decision — Ticket #TK-4521</div>
                                <div className="text-purple-400">{'{'} <span className="text-gray-300">topFactors</span>: [</div>
                                <div className="text-green-400 ml-4">"Category expertise alignment (32.1% contribution)",</div>
                                <div className="text-green-400 ml-4">"SLA deadline urgency (24.8% contribution)",</div>
                                <div className="text-green-400 ml-4">"Agent workload availability (20.3% contribution)"</div>
                                <div className="text-purple-400">],</div>
                                <div className="text-purple-400"><span className="text-gray-300">confidence</span>: {'{'}</div>
                                <div className="text-cyan-400 ml-4">factorConsistency: <span className="text-amber-300">0.847</span>,</div>
                                <div className="text-cyan-400 ml-4">dataQuality: <span className="text-amber-300">0.900</span>,</div>
                                <div className="text-cyan-400 ml-4">modelCalibration: <span className="text-amber-300">0.723</span></div>
                                <div className="text-purple-400">{'}'} {'}'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================= ARCHITECTURE ========================= */}
                <section id="architecture" className="py-24 bg-[#0d0a12] text-white relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">System Architecture</span>
                            <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-5">
                                MATIE Intelligence Pipeline
                            </h2>
                            <p className="text-gray-400 text-lg">
                                From ticket intake to intelligent resolution — every step is powered by adaptive AI that learns from your organization's unique patterns.
                            </p>
                        </div>

                        <div className="bg-gray-900/50 rounded-3xl border border-gray-800 p-8 lg:p-12 backdrop-blur-sm">
                            <ArchitectureDiagram />

                            {/* MFIS Formula Display */}
                            <div className="mt-16 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl p-6 lg:p-8 border border-purple-800/30">
                                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                                    <Cpu className="w-5 h-5" />
                                    Multi-Factor Intelligence Scoring Formula
                                </h3>
                                <div className="font-mono text-sm lg:text-base text-gray-300 bg-black/30 rounded-xl p-4 lg:p-6 overflow-x-auto">
                                    <span className="text-purple-400">FinalScore</span> ={' '}
                                    <span className="text-indigo-300">(W₁ × ExpertiseMatch)</span> +{' '}
                                    <span className="text-blue-300">(W₂ × SentimentScore)</span> +{' '}
                                    <span className="text-cyan-300">(W₃ × WorkloadIndex)</span> +{' '}
                                    <span className="text-teal-300">(W₄ × SLAUrgency)</span> +{' '}
                                    <span className="text-emerald-300">(W₅ × EscalationProb)</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                    {[
                                        { label: 'W₁ Expertise', value: '0.30', color: 'text-indigo-300' },
                                        { label: 'W₂ Sentiment', value: '0.15', color: 'text-blue-300' },
                                        { label: 'W₃ Workload', value: '0.20', color: 'text-cyan-300' },
                                        { label: 'W₄ SLA', value: '0.20', color: 'text-teal-300' },
                                        { label: 'W₅ Escalation', value: '0.15', color: 'text-emerald-300' },
                                    ].map(w => (
                                        <div key={w.label} className="text-center">
                                            <p className={`text-xl font-black ${w.color}`}>{w.value}</p>
                                            <p className="text-xs text-gray-500 mt-1">{w.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Sigmoid Normalization Visualization */}
                                <div className="mt-8 pt-8 border-t border-purple-800/20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h4 className="font-bold text-purple-300 text-sm mb-2">Sigmoid Normalization $S(t)$</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                            The raw MFIS signal ($\Sigma$) is mapped to a deterministic probability continuous curve $[0, 1]$ before routing decisions, protecting against unbounded algorithmic drift.
                                        </p>
                                        <div className="bg-black/30 rounded-xl p-3 font-mono text-[10px] text-gray-300 border border-purple-900/50">
                                            <span className="text-pink-400">function</span> <span className="text-blue-300">sigmoid</span>(t) {'{'}
                                            <br />&nbsp;&nbsp;<span className="text-pink-400">return</span> 1 / (1 + Math.exp(-t));
                                            <br />{'}'}
                                        </div>
                                    </div>
                                    <div className="relative h-32 flex items-center justify-center bg-black/20 rounded-xl border border-purple-900/30 overflow-hidden">
                                        {/* Sigmoid SVG Curve */}
                                        <svg viewBox="0 0 200 100" className="w-full h-full p-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                            <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                                                <line x1="0" y1="50" x2="200" y2="50" />
                                                <line x1="100" y1="0" x2="100" y2="100" />
                                            </g>
                                            <path
                                                d="M 10 90 C 70 90, 80 10, 190 10"
                                                fill="none"
                                                stroke="url(#sigmoid-gradient)"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="sigmoid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#ec4899" />
                                                    <stop offset="50%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#3b82f6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Data Flow */}
                            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Layers className="w-5 h-5 text-purple-400" />
                                        <h4 className="font-bold text-sm">Data Ingestion</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">Multi-channel ticket intake with real-time NLP preprocessing. Supports email, portal, API, and chat integrations.</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <GitBranch className="w-5 h-5 text-indigo-400" />
                                        <h4 className="font-bold text-sm">Intelligence Layer</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">MFIS scoring engine + Escalation Prediction run in parallel. Tenant-isolated model weights ensure personalized routing.</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Gauge className="w-5 h-5 text-cyan-400" />
                                        <h4 className="font-bold text-sm">Adaptive Optimization</h4>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">Feedback loop processes resolution outcomes to recalibrate model weights. Convergence improves accuracy by 15-20% monthly.</p>
                                </div>
                            </div>

                            {/* Microservice Data Isolation Visual */}
                            <div className="mt-12 bg-gray-800/30 rounded-2xl p-6 lg:p-8 border border-gray-700/50">
                                <h3 className="text-lg font-bold text-gray-200 mb-6 text-center">Multi-Tenant Microservice Isolation</h3>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-8">
                                    {[1, 2, 3].map((tenant) => (
                                        <div key={tenant} className="flex-1 bg-gray-900/80 rounded-xl border border-gray-700 p-4 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span className="text-xs font-bold text-gray-300">Tenant {tenant}</span>
                                                </div>
                                                <Shield className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-6 bg-gray-800/50 rounded flex items-center justify-center text-[10px] font-mono text-gray-400 border border-gray-700/50">Local Weights</div>
                                                <div className="h-6 bg-gray-800/50 rounded flex items-center justify-center text-[10px] font-mono text-gray-400 border border-gray-700/50">JWT Auth Envelope</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================= PATENT & INNOVATION ========================= */}
                <section id="innovation" className="py-24 bg-white dark:bg-[#100c18]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Patent-Pending Innovation</span>
                                <h2 className="text-3xl lg:text-4xl font-bold mt-4 mb-6">
                                    Why MATIE Is Not a<br />Traditional Helpdesk
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                                    Traditional helpdesks use static rules for ticket routing. MATIE introduces a fundamentally new approach: a self-learning, multi-factor intelligence scoring system that adapts to each organization's unique operational patterns.
                                </p>

                                <div className="space-y-6">
                                    <InnovationPoint
                                        title="Dynamic Weight Optimization"
                                        description="Unlike fixed-rule systems, MATIE continuously recalibrates its 5-factor scoring weights using gradient-descent-inspired algorithms against real resolution outcomes."
                                    />
                                    <InnovationPoint
                                        title="Proactive Escalation Prevention"
                                        description="Rather than reacting to escalations, MATIE predicts them using multi-signal analysis (NLP sentiment + response delays + repeat patterns) and triggers interventions before customer impact."
                                    />
                                    <InnovationPoint
                                        title="Tenant-Isolated Learning"
                                        description="Each organization gets its own model weights that evolve independently, ensuring routing intelligence is personalized — not generalized from unrelated industries."
                                    />
                                </div>

                                <Link to="/patent" className="inline-flex items-center gap-2 mt-8 text-purple-600 dark:text-purple-400 font-bold hover:gap-3 transition-all">
                                    View Full Patent Documentation
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Innovation Visual */}
                            <div className="relative">
                                <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-3xl p-8 border border-purple-200/30 dark:border-purple-800/30">
                                    <div className="space-y-4">
                                        <ComparisonRow label="Routing Method" traditional="Static Rules" matie="Adaptive AI (5-Factor)" />
                                        <ComparisonRow label="Learning" traditional="None" matie="Self-Optimizing" />
                                        <ComparisonRow label="Escalation" traditional="Reactive" matie="Predictive (NLP)" />
                                        <ComparisonRow label="Accuracy" traditional="~55%" matie="94%+" />
                                        <ComparisonRow label="Personalization" traditional="Global Rules" matie="Per-Tenant Models" />
                                        <ComparisonRow label="SLA Compliance" traditional="~72%" matie="96%+" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================= DASHBOARD DEMO ========================= */}
                <section id="demo" className="py-24 bg-[#0d0a12] relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Live Intelligence Dashboard</span>
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-4 mb-5">
                                Real-Time AI Metrics at a Glance
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Monitor MATIE's performance with live dashboards showing routing accuracy, escalation prevention, SLA compliance, and agent efficiency.
                            </p>
                        </div>

                        <DashboardDemo />
                    </div>
                </section>

                {/* ========================= TESTIMONIALS ========================= */}
                <section className="py-24 bg-[#f7f6f8] dark:bg-[#0d0a12]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">Trusted by Enterprise IT Leaders</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="MATIE reduced our ticket escalation rate by 67% in the first month. The predictive engine caught issues our team would have missed until customers called back angry."
                                author="Sarah Jenkins"
                                role="CTO, TechFlow Inc."
                            />
                            <TestimonialCard
                                quote="The white-label architecture lets us brand MATIE for each of our 200+ managed clients. It's like giving each one a custom-built AI helpdesk without the engineering cost."
                                author="Michael Chen"
                                role="VP Engineering, CloudScale MSP"
                            />
                            <TestimonialCard
                                quote="We went from 55% first-call resolution to 91% after deploying MATIE's adaptive routing. The self-learning weights made a visible difference within 2 weeks."
                                author="Elena Rodriguez"
                                role="Director of Support, DataSecure"
                            />
                        </div>
                    </div>
                </section>

                {/* ========================= CTA ========================= */}
                <section className="py-28 bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }} />

                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">
                            Ready to Deploy Intelligent<br />IT Support?
                        </h2>
                        <p className="text-lg text-purple-100 mb-10 max-w-2xl mx-auto">
                            Join the enterprises replacing static routing with adaptive intelligence.
                            MATIE starts learning from your team on day one.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                            <Link to="/register" className="w-full sm:w-auto bg-white text-purple-700 text-lg font-bold py-4 px-10 rounded-xl shadow-xl hover:shadow-2xl transition-all flex justify-center items-center gap-2">
                                Request Demo
                                <RocketIcon className="w-5 h-5" />
                            </Link>
                            <Link to="/pitch" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all hover:bg-white/20">
                                Contact Sales
                            </Link>
                        </div>

                        <p className="mt-6 text-sm text-purple-200 opacity-80">No credit card required • Enterprise pricing available • SOC 2 compliant</p>
                    </div>
                </section>
            </main>

            {/* ========================= FOOTER ========================= */}
            <footer className="bg-white dark:bg-[#0a0810] pt-16 pb-8 border-t border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg text-white">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <span className="font-black text-lg">MATIE</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
                                MetaMinds Adaptive Ticket Intelligence Engine — patent-pending AI technology for enterprise IT support.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a className="hover:text-purple-600 transition-colors" href="#features">Features</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#architecture">Architecture</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#demo">Dashboard</a></li>
                                <li><Link className="hover:text-purple-600 transition-colors" to="/patent">Patent</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a className="hover:text-purple-600 transition-colors" href="#">About MetaMinds</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#">Careers</a></li>
                                <li><Link className="hover:text-purple-600 transition-colors" to="/pitch">Investors</Link></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a className="hover:text-purple-600 transition-colors" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#">Security</a></li>
                                <li><a className="hover:text-purple-600 transition-colors" href="#">GDPR</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">© 2026 MetaMinds Inc. All rights reserved. MATIE™ is a registered trademark.</p>
                        <div className="flex gap-6 text-sm text-gray-400">
                            <a className="hover:text-purple-600" href="#">Privacy</a>
                            <a className="hover:text-purple-600" href="#">Terms</a>
                            <a className="hover:text-purple-600" href="#">Security</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Gradient Animation Keyframes */}
            <style>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 4s ease infinite;
                }
            `}</style>
        </div>
    );
};

// ============================================
// Innovation Sub-Components
// ============================================

const InnovationPoint: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mt-0.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    </div>
);

const ComparisonRow: React.FC<{ label: string; traditional: string; matie: string }> = ({ label, traditional, matie }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-purple-200/10 dark:border-purple-800/20 last:border-0">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-400 text-center">{traditional}</span>
        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 text-center">{matie}</span>
    </div>
);
