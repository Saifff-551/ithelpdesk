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

// Slide 1 - Title Slide
const TitleSlide: React.FC = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#5e2b97] via-[#7b1fa2] to-[#6a1b9a] relative flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 20% 30%, rgba(225,190,231,0.18), transparent 55%),
                   radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%)`
        }} />
        <div className="absolute w-[520px] h-[520px] -top-60 -right-48 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)]" />
        <div className="absolute w-[420px] h-[420px] -bottom-52 -left-40 rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)]" />
        <div className="absolute w-[260px] h-[260px] top-24 left-[18%] rounded-full bg-gradient-to-br from-[rgba(225,190,231,0.25)] to-[rgba(255,255,255,0.08)] opacity-40" />

        <div className="relative z-10 text-center px-24">
            {/* Icon row */}
            <div className="flex justify-center gap-4 mb-10 opacity-90">
                <span className="material-icons text-white text-4xl">support_agent</span>
                <span className="material-icons text-white text-4xl">business</span>
                <span className="material-icons text-white text-4xl">hub</span>
            </div>

            <h1 className="text-white text-[56px] font-bold leading-tight max-w-5xl mx-auto mb-6">
                Centralized White-Label<br />
                Enterprise AI Infrastructure Platform
            </h1>

            <div className="mx-auto mb-8 h-[3px] w-64 bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <p className="text-white/95 text-2xl font-light leading-relaxed max-w-3xl mx-auto mb-12">
                A Multi-Tenant, Secure &amp; AI-Powered SaaS Solution
            </p>

            {/* Feature badges */}
            <div className="flex justify-center gap-6 mb-16">
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                    <span className="material-icons text-white text-lg">multiple_stop</span>
                    <span className="text-white text-sm font-medium">Multi-Tenant</span>
                </div>
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                    <span className="material-icons text-white text-lg">lock</span>
                    <span className="text-white text-sm font-medium">Secure</span>
                </div>
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
                    <span className="material-icons text-white text-lg">psychology</span>
                    <span className="text-white text-sm font-medium">AI-Powered</span>
                </div>
            </div>

            <div className="absolute bottom-10 inset-x-0">
                <p className="text-white/85 text-base tracking-wide">
                    Presented by <span className="font-semibold">MetaMinds</span> ·
                    <span className="font-light">CSE (Artificial Intelligence &amp; Machine Learning)</span>
                </p>
            </div>
        </div>
    </div>
);

// Slide 2 - Problem Statement
const ProblemSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[90px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Problem Statement</h1>
        </div>

        <div className="flex h-[calc(100%-90px)]">
            <div className="w-3/5 px-16 py-14 flex flex-col justify-center space-y-7">
                {[
                    { icon: 'schedule', title: 'Ticket Delays', desc: 'Long response times frustrate employees and significantly reduce productivity.' },
                    { icon: 'trending_down', title: 'Inconsistent Service Quality', desc: 'Variations in support quality across teams, locations, and time periods.' },
                    { icon: 'storage', title: 'Knowledge Silos', desc: 'Critical information remains isolated within individuals or disconnected systems.' },
                    { icon: 'bar_chart', title: 'Limited Analytics & Visibility', desc: 'Lack of actionable insights into performance metrics and operational bottlenecks.' },
                    { icon: 'security', title: 'Security & Compliance Risks', desc: 'Increased risk of data exposure due to fragmented and unsecured information storage.' },
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <span className="material-icons text-[#6A1B9A] text-[30px]">{item.icon}</span>
                        <div>
                            <h3 className="text-[#6A1B9A] font-semibold text-[20px] mb-1">{item.title}</h3>
                            <p className="text-gray-700 text-[18px] leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-2/5 py-14 pr-16 flex items-center">
                <div className="w-full h-[520px] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-icons text-[#6A1B9A] text-[120px] opacity-30">support_agent</span>
                        <p className="text-[#6A1B9A] text-xl font-medium mt-4">IT Support Challenges</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Slide 3 - Existing Solutions & Limitations  
const LimitationsSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[90px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Existing Solutions & Limitations</h1>
        </div>

        <div className="flex h-[calc(100%-90px)]">
            {/* Traditional Systems */}
            <div className="w-1/2 px-16 py-14 flex flex-col">
                <div className="mb-8">
                    <h2 className="text-[26px] font-semibold text-red-700 flex items-center gap-2 mb-2">
                        <span className="material-icons text-[30px]">desktop_windows</span>
                        Traditional Routing Systems
                    </h2>
                    <div className="w-20 h-[3px] bg-red-500" />
                </div>

                <div className="space-y-4">
                    {['High setup and infrastructure cost', 'Requires on-premise maintenance', 'Limited scalability for growing organizations', 'Complex integrations and upgrades', 'Poor support for multi-tenant environments'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                            <span className="material-icons text-red-500">close</span>
                            <span className="text-gray-800 text-[20px]">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modern SaaS */}
            <div className="w-1/2 px-16 py-14 flex flex-col">
                <div className="mb-8">
                    <h2 className="text-[26px] font-semibold text-[#6A1B9A] flex items-center gap-2 mb-2">
                        <span className="material-icons text-[30px]">cloud</span>
                        Modern SaaS Routing Platforms
                    </h2>
                    <div className="w-20 h-[3px] bg-[#6A1B9A]" />
                </div>

                <div className="space-y-4">
                    {['Cloud-based access from anywhere', 'Scalable infrastructure on demand', 'Automatic updates and maintenance', 'Easy API and third-party integrations', 'Designed for secure multi-tenant usage'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50">
                            <span className="material-icons text-[#6A1B9A]">check_circle</span>
                            <span className="text-gray-800 text-[20px]">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Slide 4 - Proposed Solution
const SolutionSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[90px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-white text-[38px] font-bold tracking-wide">Proposed Solution</h1>
        </div>

        <div className="h-[calc(100%-90px)] flex flex-col justify-center px-20">
            {/* Core Idea */}
            <div className="text-center mb-14">
                <div className="inline-block px-14 py-10 rounded-2xl border border-purple-200 bg-purple-50">
                    <div className="flex justify-center gap-4 mb-4">
                        <span className="material-icons text-[#6A1B9A] text-[44px]">hub</span>
                        <span className="material-icons text-[#6A1B9A] text-[44px]">business</span>
                    </div>
                    <h2 className="text-[#6A1B9A] text-[44px] font-semibold leading-tight">
                        Single Platform,<br />Multiple Companies
                    </h2>
                    <div className="w-28 h-[3px] bg-[#6A1B9A] mx-auto mt-6" />
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                    { icon: 'account_tree', title: 'Multi-Tenant Architecture', desc: 'Secure data isolation per company on shared infrastructure.' },
                    { icon: 'palette', title: 'White-Label Customization', desc: 'Company-specific branding, logos, and custom domains.' },
                    { icon: 'psychology', title: 'AI-Powered Automation', desc: 'Intelligent routing, chat assistance, and knowledge support.' },
                    { icon: 'insights', title: 'Centralized Analytics', desc: 'Dashboards, KPIs, and performance insights per organization.' },
                    { icon: 'security', title: 'Enterprise-Grade Security', desc: 'Encryption, role-based access, and compliance readiness.' },
                    { icon: 'speed', title: 'Rapid Deployment', desc: 'Cloud-based platform with quick onboarding and scalability.' },
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-xl border border-purple-200 bg-white text-center">
                        <span className="material-icons text-[#6A1B9A] text-[42px] mb-3">{item.icon}</span>
                        <h3 className="text-[#6A1B9A] font-semibold text-[20px] mb-2">{item.title}</h3>
                        <p className="text-gray-700 text-[18px] leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 5 - Multi-Tenant Architecture
const ArchitectureSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Multi-Tenant Architecture</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-[45%] px-16 py-12 flex flex-col justify-center">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-icons text-[#6A1B9A] text-4xl">account_tree</span>
                        <h2 className="text-[32px] font-bold text-[#6A1B9A]">Isolated & Secure</h2>
                    </div>
                    <div className="w-24 h-1 bg-[#6A1B9A]" />
                </div>

                <div className="space-y-5">
                    {[
                        { icon: 'database', title: 'Isolated Data', desc: 'Each tenant has separate database instances' },
                        { icon: 'cloud_queue', title: 'Shared Infrastructure', desc: 'Common application layer and resources' },
                        { icon: 'branding_watermark', title: 'Dedicated Branding', desc: 'Custom logos, colors, and domains per tenant' },
                        { icon: 'trending_up', title: 'Scalable Resources', desc: 'Dynamic allocation based on tenant needs' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="mt-1">
                                <span className="material-icons text-[#6A1B9A] text-3xl">{item.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-[#6A1B9A] font-semibold text-[24px] mb-1">{item.title}</h3>
                                <p className="text-gray-700 text-[20px] leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-[55%] py-12 pr-16 flex items-center">
                <div className="w-full h-[520px] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#E1BEE7] bg-gradient-to-br from-purple-50 to-white flex flex-col items-center justify-center">
                    <div className="bg-[#6A1B9A] text-white rounded-2xl px-8 py-4 text-xl font-semibold mb-8 shadow-lg">
                        Central Platform
                    </div>
                    <div className="flex gap-8">
                        {['Company A', 'Company B', 'Company C'].map((company, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-1 h-8 bg-[#6A1B9A]" />
                                <div className="bg-white border-2 border-[#6A1B9A] rounded-xl px-6 py-4 shadow-md">
                                    <span className="material-icons text-[#6A1B9A] text-2xl block mb-2">business</span>
                                    <span className="text-[#6A1B9A] font-medium">{company}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Slide 6 - White-Label Concept
const WhiteLabelSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">White-Label Concept</h1>
        </div>

        <div className="flex h-[calc(100%-85px)]">
            <div className="w-[38%] px-12 py-10 flex flex-col justify-center">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-icons text-[#6A1B9A] text-4xl">palette</span>
                        <h2 className="text-[32px] font-bold text-[#6A1B9A]">Branding Freedom</h2>
                    </div>
                    <div className="w-24 h-1 bg-[#6A1B9A]" />
                </div>

                <div className="space-y-4">
                    {['Custom Branding per Company', 'Dedicated Domain', 'Consistent Brand Experience', 'Full Customization Control'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-purple-50 rounded-lg p-4">
                            <span className="material-icons text-[#6A1B9A] text-2xl">check_circle</span>
                            <span className="text-gray-800 text-[22px] font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-[62%] py-10 pr-12 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Company A */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-[#E1BEE7] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6A1B9A] to-[#7B1FA2] flex items-center justify-center">
                                <span className="text-white font-bold text-[24px]">A</span>
                            </div>
                            <h3 className="text-[#6A1B9A] font-semibold text-[26px]">Company A</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#6A1B9A] text-xl">circle</span>
                                <span className="text-gray-700 text-[20px]">Purple Theme</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#6A1B9A] text-xl">label</span>
                                <span className="text-gray-700 text-[20px]">Logo A</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#6A1B9A] text-xl">language</span>
                                <span className="text-gray-700 text-[18px]">domain-a.matie.app</span>
                            </div>
                        </div>
                    </div>

                    {/* Company B */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-[#E1BEE7] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2196F3] to-[#1976D2] flex items-center justify-center">
                                <span className="text-white font-bold text-[24px]">B</span>
                            </div>
                            <h3 className="text-[#2196F3] font-semibold text-[26px]">Company B</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#2196F3] text-xl">circle</span>
                                <span className="text-gray-700 text-[20px]">Blue Theme</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#2196F3] text-xl">label</span>
                                <span className="text-gray-700 text-[20px]">Logo B</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-[#2196F3] text-xl">language</span>
                                <span className="text-gray-700 text-[18px]">domain-b.matie.app</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-[200px] rounded-2xl overflow-hidden shadow-xl border-4 border-[#E1BEE7] bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[#6A1B9A] text-2xl font-semibold">One Platform, Many Brands</p>
                        <p className="text-gray-600 text-lg mt-2">Each company gets their own branded experience</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Slide 7 - Platform Architecture
const PlatformArchSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Platform Architecture</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-20">
            <div className="flex flex-col gap-4 w-full max-w-4xl">
                {[
                    { name: 'Frontend', tech: 'React + TypeScript + Tailwind', color: '#c4b5fd', icon: 'web' },
                    { name: 'Backend', tech: 'Node.js + Firebase Functions', color: '#a78bfa', icon: 'dns' },
                    { name: 'Database', tech: 'Cloud Firestore', color: '#8b5cf6', icon: 'storage' },
                    { name: 'AI Layer', tech: 'TensorFlow + OpenAI', color: '#7c3aed', icon: 'psychology' },
                    { name: 'Cloud', tech: 'Vercel + Google Cloud Platform', color: '#6d28d9', icon: 'cloud' },
                ].map((layer, i) => (
                    <div key={i} className="flex items-center gap-4 p-6 rounded-xl text-white" style={{ backgroundColor: layer.color }}>
                        <span className="material-icons text-4xl">{layer.icon}</span>
                        <div>
                            <h3 className="text-2xl font-bold">{layer.name}</h3>
                            <p className="text-white/90">{layer.tech}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 8 - User Roles
const RolesSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">User Roles & Permissions</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="grid grid-cols-5 gap-6">
                {[
                    { name: 'Platform Admin', icon: 'admin_panel_settings', desc: 'Full system access', color: '#6d28d9' },
                    { name: 'Company Admin', icon: 'business', desc: 'Manage organization', color: '#7c3aed' },
                    { name: 'IT Manager', icon: 'settings', desc: 'Configure infrastructure', color: '#8b5cf6' },
                    { name: 'Support Agent', icon: 'support_agent', desc: 'Handle tickets', color: '#a78bfa' },
                    { name: 'Employee', icon: 'person', desc: 'Create tickets', color: '#c4b5fd' },
                ].map((role, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-xl p-6 text-center border-t-4" style={{ borderColor: role.color }}>
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${role.color}20` }}>
                            <span className="material-icons text-3xl" style={{ color: role.color }}>{role.icon}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg">{role.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{role.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 9 - Ticket Workflow
const WorkflowSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Employee Ticket Workflow</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="flex items-center gap-6">
                {[
                    { step: '1', text: 'Login', icon: 'login' },
                    { step: '2', text: 'Create Ticket', icon: 'add_circle' },
                    { step: '3', text: 'Auto-Assign', icon: 'route' },
                    { step: '4', text: 'Track Progress', icon: 'timeline' },
                    { step: '5', text: 'Resolution', icon: 'check_circle' },
                ].map((item, i) => (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#6A1B9A] to-[#7B1FA2] rounded-2xl flex items-center justify-center shadow-lg mb-4">
                                <span className="material-icons text-white text-4xl">{item.icon}</span>
                            </div>
                            <span className="text-[#6A1B9A] font-semibold text-lg">{item.text}</span>
                        </div>
                        {i < 4 && <span className="material-icons text-[#6A1B9A] text-4xl">arrow_forward</span>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
);

// Slide 10 - Ticket Lifecycle
const LifecycleSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Ticket Lifecycle Management</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="flex items-center gap-4">
                {[
                    { name: 'Open', color: '#3b82f6' },
                    { name: 'Assigned', color: '#f59e0b' },
                    { name: 'In Progress', color: '#f97316' },
                    { name: 'Resolved', color: '#22c55e' },
                    { name: 'Closed', color: '#6b7280' },
                ].map((status, i) => (
                    <React.Fragment key={i}>
                        <div className="px-8 py-6 rounded-xl text-white font-semibold text-xl shadow-lg" style={{ backgroundColor: status.color }}>
                            {status.name}
                        </div>
                        {i < 4 && <span className="material-icons text-gray-400 text-3xl">arrow_forward</span>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
);

// Slide 11 - AI Features
const AISlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">AI-Powered Features</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="grid grid-cols-2 gap-8 max-w-4xl">
                {[
                    { icon: 'psychology', title: 'Auto Classification', desc: 'AI categorizes tickets by type and urgency automatically' },
                    { icon: 'trending_up', title: 'Priority Prediction', desc: 'ML models predict ticket priority based on content' },
                    { icon: 'smart_toy', title: 'Smart Chatbot', desc: '24/7 AI assistance for common queries and issues' },
                    { icon: 'lightbulb', title: 'Response Suggestions', desc: 'AI-generated reply recommendations for agents' },
                ].map((item, i) => (
                    <div key={i} className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border border-purple-100">
                        <div className="w-16 h-16 bg-[#6A1B9A] rounded-xl flex items-center justify-center mb-4">
                            <span className="material-icons text-white text-3xl">{item.icon}</span>
                        </div>
                        <h3 className="text-[#6A1B9A] font-bold text-2xl mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-lg">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 12 - Security
const SecuritySlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Security & Data Protection</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="grid grid-cols-2 gap-8 max-w-4xl">
                {[
                    { icon: 'shield', title: 'Tenant Isolation', desc: 'Complete data separation between organizations' },
                    { icon: 'vpn_key', title: 'Role-Based Access', desc: 'Granular permissions per user role' },
                    { icon: 'lock', title: 'Encrypted Data', desc: 'AES-256 encryption at rest and in transit' },
                    { icon: 'history', title: 'Audit Logs', desc: 'Complete activity tracking and compliance' },
                ].map((item, i) => (
                    <div key={i} className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border border-purple-100">
                        <div className="w-16 h-16 bg-[#6A1B9A] rounded-xl flex items-center justify-center mb-4">
                            <span className="material-icons text-white text-3xl">{item.icon}</span>
                        </div>
                        <h3 className="text-[#6A1B9A] font-bold text-2xl mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-lg">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 13 - Analytics
const AnalyticsSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Dashboards & Analytics</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="w-full max-w-5xl">
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Tickets', value: '1,234', icon: 'confirmation_number' },
                        { label: 'Open Issues', value: '42', icon: 'pending' },
                        { label: 'SLA Compliance', value: '98%', icon: 'verified' },
                        { label: 'Avg Resolution', value: '4.2h', icon: 'schedule' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-lg p-6 text-center border-t-4 border-[#6A1B9A]">
                            <span className="material-icons text-[#6A1B9A] text-4xl mb-2">{item.icon}</span>
                            <p className="text-4xl font-bold text-[#6A1B9A]">{item.value}</p>
                            <p className="text-gray-500 mt-2">{item.label}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-purple-50 rounded-2xl p-8 text-center">
                    <span className="material-icons text-[#6A1B9A] text-6xl mb-4">insights</span>
                    <p className="text-[#6A1B9A] text-2xl font-semibold">Real-time KPIs & Performance Metrics</p>
                </div>
            </div>
        </div>
    </div>
);

// Slide 14 - Tech Stack
const TechStackSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Technology Stack</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="grid grid-cols-5 gap-6">
                {[
                    { category: 'Frontend', tech: 'React + TypeScript', icon: 'web' },
                    { category: 'Backend', tech: 'Node.js + Firebase', icon: 'dns' },
                    { category: 'Database', tech: 'Cloud Firestore', icon: 'storage' },
                    { category: 'AI/ML', tech: 'TensorFlow', icon: 'psychology' },
                    { category: 'Cloud', tech: 'Vercel + GCP', icon: 'cloud' },
                ].map((item, i) => (
                    <div key={i} className="bg-purple-50 rounded-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-[#6A1B9A] rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="material-icons text-white text-3xl">{item.icon}</span>
                        </div>
                        <h3 className="text-[#6A1B9A] font-bold text-xl mb-1">{item.category}</h3>
                        <p className="text-gray-600">{item.tech}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 15 - Advantages
const AdvantagesSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Platform Advantages</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="grid grid-cols-2 gap-4 max-w-4xl">
                {[
                    'Scalable Multi-Tenant Architecture',
                    'Complete Brand Customization',
                    'AI-Powered Automation',
                    'Enterprise-Grade Security',
                    'Real-Time Analytics',
                    'Quick Deployment',
                    'Cost-Effective Solution',
                    '24/7 AI Assistance',
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-purple-50 rounded-xl p-5">
                        <span className="material-icons text-[#6A1B9A] text-3xl">check_circle</span>
                        <span className="text-gray-800 text-xl">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 16 - Use Case
const UseCaseSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Real-World Use Case</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="text-center">
                <div className="inline-flex items-center gap-4 bg-purple-50 rounded-2xl px-8 py-4 mb-8">
                    <span className="material-icons text-[#6A1B9A] text-4xl">business</span>
                    <span className="text-[#6A1B9A] text-3xl font-bold">TechCorp Inc.</span>
                </div>
                <div className="flex items-center gap-4 justify-center">
                    {['Employee submits ticket', 'AI categorizes & routes', 'Agent assigned instantly', 'Resolution tracked', 'Employee notified'].map((step, i) => (
                        <React.Fragment key={i}>
                            <div className="bg-white rounded-xl shadow-lg p-4 border border-purple-200 w-40">
                                <p className="text-[#6A1B9A] font-medium text-sm">{step}</p>
                            </div>
                            {i < 4 && <span className="material-icons text-[#6A1B9A] text-2xl">arrow_forward</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Slide 17 - Future
const FutureSlide: React.FC = () => (
    <div className="w-full h-full bg-white">
        <div className="h-[85px] bg-gradient-to-r from-[#6A1B9A] to-[#7B1FA2] flex items-center px-16">
            <h1 className="text-[40px] font-bold text-white">Future Enhancements</h1>
        </div>
        <div className="h-[calc(100%-85px)] flex items-center justify-center px-16">
            <div className="flex gap-8">
                {[
                    { phase: 'Phase 1', title: 'Mobile Apps', desc: 'iOS & Android support', icon: 'smartphone' },
                    { phase: 'Phase 2', title: 'Integrations', desc: 'Slack, Teams, Email', icon: 'integration_instructions' },
                    { phase: 'Phase 3', title: 'Advanced AI', desc: 'Predictive analytics', icon: 'psychology' },
                ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-xl p-8 text-center w-72 border-t-4 border-[#6A1B9A]">
                        <span className="text-sm text-[#6A1B9A] font-medium bg-purple-100 px-3 py-1 rounded-full">{item.phase}</span>
                        <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto my-6 flex items-center justify-center">
                            <span className="material-icons text-[#6A1B9A] text-4xl">{item.icon}</span>
                        </div>
                        <h3 className="text-[#6A1B9A] font-bold text-2xl mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Slide 18 - Conclusion
const ConclusionSlide: React.FC = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#5e2b97] via-[#7b1fa2] to-[#6a1b9a] flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-white text-6xl font-bold mb-10">Conclusion</h1>
            <div className="flex flex-wrap justify-center gap-4 mb-10 max-w-4xl">
                {['Centralized Enterprise Solution', 'Multi-Tenant & Secure', 'AI-Powered Automation', 'Fully Customizable White-Label', 'Production-Ready Platform'].map((item, i) => (
                    <span key={i} className="bg-white/20 backdrop-blur rounded-full px-6 py-3 text-white text-lg">{item}</span>
                ))}
            </div>
            <p className="text-white/90 text-2xl">Empowering enterprises with intelligent IT support</p>
        </div>
    </div>
);

// Slide 19 - Thank You
const ThankYouSlide: React.FC = () => (
    <div className="w-full h-full bg-gradient-to-br from-[#5e2b97] via-[#7b1fa2] to-[#6a1b9a] relative flex items-center justify-center">
        <div className="absolute inset-0" style={{
            background: `radial-gradient(circle at 20% 30%, rgba(225,190,231,0.18), transparent 55%),
                   radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 60%)`
        }} />
        <div className="relative z-10 text-center">
            <h1 className="text-white text-8xl font-bold mb-6">Thank You</h1>
            <p className="text-white/80 text-4xl mb-16">Questions?</p>
            <div className="absolute bottom-10 inset-x-0">
                <p className="text-white/85 text-lg tracking-wide">
                    Presented by <span className="font-semibold">MetaMinds</span> ·
                    <span className="font-light">CSE (Artificial Intelligence &amp; Machine Learning)</span>
                </p>
            </div>
        </div>
    </div>
);

// All slides array
const slideComponents = [
    TitleSlide,
    ProblemSlide,
    LimitationsSlide,
    SolutionSlide,
    ArchitectureSlide,
    WhiteLabelSlide,
    PlatformArchSlide,
    RolesSlide,
    WorkflowSlide,
    LifecycleSlide,
    AISlide,
    SecuritySlide,
    AnalyticsSlide,
    TechStackSlide,
    AdvantagesSlide,
    UseCaseSlide,
    FutureSlide,
    ConclusionSlide,
    ThankYouSlide,
];

const slideNames = [
    'Title', 'Problem Statement', 'Existing Solutions', 'Proposed Solution',
    'Multi-Tenant Architecture', 'White-Label Concept', 'Platform Architecture',
    'User Roles', 'Ticket Workflow', 'Ticket Lifecycle', 'AI Features',
    'Security', 'Analytics', 'Technology Stack', 'Advantages',
    'Use Case', 'Future Enhancements', 'Conclusion', 'Thank You'
];

// Main component
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
