import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { getTickets, getTicketStats } from '../services/tickets';
import { getUsersByTenant } from '../services/firestore';
import { getAIInsights } from '../services/matie/matieService';
import { Ticket, Profile, TicketStatus, TicketPriority } from '../types';
import type { AIInsights } from '../services/matie/types';
import { checkUserPermission } from '../services/rbac';
import {
    Ticket as TicketIcon,
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    Loader2,
    Calendar,
    User,
    BarChart3,
    Activity,
    Zap,
} from 'lucide-react';

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; positive: boolean };
    onClick?: () => void;
}> = ({ title, value, icon, color, trend, onClick }) => (
    <div
        className={`bg-surface-1 rounded-xl shadow-card border border-border-default p-6 ${onClick ? 'cursor-pointer hover:bg-surface-2 hover:border-border-strong transition-all duration-fast' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
                {trend && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-4 h-4 ${!trend.positive ? 'rotate-180' : ''}`} />
                        {trend.value}% vs last week
                    </p>
                )}
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                {icon}
            </div>
        </div>
    </div>
);

// Priority Badge
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
    const colors: Record<TicketPriority, string> = {
        low: 'bg-gray-100 text-gray-600',
        medium: 'bg-blue-100 text-blue-600',
        high: 'bg-orange-100 text-orange-600',
        urgent: 'bg-red-100 text-red-600',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}>
            {priority}
        </span>
    );
};

// Status Badge
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
    const colors: Record<TicketStatus, string> = {
        created: 'bg-surface-3 text-gray-400 border border-border-default',
        routing_pending: 'bg-status-info/10 text-status-info border border-status-info/20',
        routing_in_progress: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
        assigned: 'bg-primary/10 text-primary border border-primary/20',
        degraded_assigned: 'bg-status-degraded/10 text-status-degraded border border-status-degraded/20',
        unassigned: 'bg-status-critical/10 text-status-critical border border-status-critical/20',
        failed: 'bg-status-critical/20 text-status-critical border border-status-critical/30',
        open: 'bg-blue-900/20 text-blue-400 border border-blue-500/30',
        in_progress: 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30',
        resolved: 'bg-green-900/20 text-green-400 border border-green-500/30',
        closed: 'bg-surface-2 text-gray-500 border border-border-strong',
    };
    const labels: Record<TicketStatus, string> = {
        created: 'Created',
        routing_pending: 'Queue Pending',
        routing_in_progress: 'AI Routing...',
        assigned: 'Assigned',
        degraded_assigned: 'Fallback Assigned',
        unassigned: 'Unassigned',
        failed: 'Failed',
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono font-bold ${colors[status]} flex items-center gap-1.5`}>
            {status === 'routing_in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse"></span>}
            {labels[status]}
        </span>
    );
};

export const AdminDashboard: React.FC = () => {
    const { profile, tenant } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        by_priority: Record<string, number>;
    } | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

    const primaryColor = tenant?.primary_color || '#9213ec';

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!tenant?.id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch data with individual error handling - don't let one failure block all
                let ticketsData: Ticket[] = [];
                let usersData: Profile[] = [];
                let statsData: any = { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, by_priority: {} };

                try {
                    ticketsData = await getTickets(tenant.id);
                } catch (err) {
                    console.error('Error fetching tickets:', err);
                    // Tickets query might need Firestore index, continue anyway
                }

                try {
                    usersData = await getUsersByTenant(tenant.id);
                } catch (err) {
                    console.error('Error fetching users:', err);
                }

                try {
                    statsData = await getTicketStats(tenant.id);
                } catch (err) {
                    console.error('Error fetching stats:', err);
                }

                setTickets(ticketsData.slice(0, 10));
                setUsers(usersData);
                setStats(statsData);

                // Compute MATIE AI insights from real ticket data
                if (tenant?.id && ticketsData.length > 0) {
                    try {
                        const insights = getAIInsights(tenant.id, ticketsData, 'week');
                        setAiInsights(insights);
                    } catch (err) {
                        console.error('Error computing AI insights:', err);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenant?.id]);

    // Computed values
    const activeUsers = useMemo(() => users.filter(u => u.is_active !== false).length, [users]);
    const supportAgents = useMemo(() =>
        users.filter(u => ['support_agent', 'it_manager', 'company_admin'].includes(u.role_id)).length,
        [users]
    );

    const urgentTickets = useMemo(() =>
        tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length,
        [tickets]
    );

    const recentTickets = useMemo(() =>
        [...tickets].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5),
        [tickets]
    );

    // Get agent with most tickets
    const topAgents = useMemo(() => {
        const agentCounts: Record<string, number> = {};
        tickets.forEach(t => {
            if (t.assignee_id) {
                agentCounts[t.assignee_id] = (agentCounts[t.assignee_id] || 0) + 1;
            }
        });

        return users
            .filter(u => u.id in agentCounts)
            .map(u => ({ ...u, ticketCount: agentCounts[u.id] }))
            .sort((a, b) => b.ticketCount - a.ticketCount)
            .slice(0, 5);
    }, [tickets, users]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-mono font-bold text-gray-100 flex items-center gap-3">
                        <Zap className="h-6 w-6 text-primary drop-shadow-[var(--panel-glow)]" />
                        Welcome back, {profile?.full_name?.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-400 mt-2 font-mono text-sm max-w-xl">
                        Tenant Active: <strong className="text-gray-200">{tenant?.name}</strong> • Live Infrastructure Observations & Active Workloads
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tickets"
                    value={stats?.total || 0}
                    icon={<TicketIcon className="w-6 h-6" style={{ color: primaryColor }} />}
                    color={primaryColor}
                    onClick={() => navigate('/dashboard/tickets')}
                />
                <StatCard
                    title="Open Tickets"
                    value={stats?.open || 0}
                    icon={<Clock className="w-6 h-6 text-blue-600" />}
                    color="#2563eb"
                    onClick={() => navigate('/dashboard/tickets?status=open')}
                />
                <StatCard
                    title="In Progress"
                    value={stats?.in_progress || 0}
                    icon={<Activity className="w-6 h-6 text-yellow-600" />}
                    color="#ca8a04"
                    onClick={() => navigate('/dashboard/tickets?status=in_progress')}
                />
                <StatCard
                    title="Resolved"
                    value={stats?.resolved || 0}
                    icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                    color="#16a34a"
                    onClick={() => navigate('/dashboard/tickets?status=resolved')}
                />
            </div>

            {/* MATIE AI Intelligence Metrics — Admin Only */}
            {checkUserPermission(profile?.role_id, 'view_ai_insights') ? (
                <div className="bg-surface-2 rounded-xl border border-border-strong p-6 relative overflow-hidden shadow-card">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-3 mb-6 border-b border-border-default pb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[var(--panel-glow)]">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-200 text-sm uppercase tracking-wider">MATIE Intelligence Engine</h2>
                            <p className="text-xs text-gray-500 font-mono mt-1">Adaptive Ticket Intelligence — Tenant Level</p>
                        </div>
                        <span className="ml-auto px-2.5 py-1 bg-status-operational/10 border border-status-operational/20 text-status-operational text-[10px] uppercase tracking-wider font-bold font-mono rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-operational animate-pulse"></span>
                            Active
                        </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
                        <div className="bg-surface-1 rounded-lg p-4 border border-border-default hover:bg-surface-3 transition-colors duration-fast">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">AI Routing Accuracy</p>
                            <p className="text-3xl font-mono font-bold" style={{ color: primaryColor }}>{aiInsights ? `${(aiInsights.routingAccuracy * 100).toFixed(1)}%` : '—'}</p>
                            <p className="text-xs text-status-info mt-2">{aiInsights ? `${aiInsights.aiProcessedTickets} workloads` : 'Computing...'}</p>
                        </div>
                        <div className="bg-surface-1 rounded-lg p-4 border border-border-default hover:bg-surface-3 transition-colors duration-fast">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Avg Resolution Time</p>
                            <p className="text-3xl font-mono font-bold text-blue-500">{aiInsights ? `${aiInsights.avgResolutionTimeHours}h` : '—'}</p>
                            <p className="text-xs text-gray-400 mt-2">Rolling 7 days</p>
                        </div>
                        <div className="bg-surface-1 rounded-lg p-4 border border-border-default hover:bg-surface-3 transition-colors duration-fast">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Escalation Prevention</p>
                            <p className="text-3xl font-mono font-bold text-status-operational">{aiInsights ? `${(aiInsights.escalationPreventionRate * 100).toFixed(1)}%` : '—'}</p>
                            <p className="text-xs text-gray-400 mt-2">Critical deflection</p>
                        </div>
                        <div className="bg-surface-1 rounded-lg p-4 border border-border-default hover:bg-surface-3 transition-colors duration-fast">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">SLA Compliance</p>
                            <p className="text-3xl font-mono font-bold text-teal-500">{aiInsights ? `${(aiInsights.slaComplianceRate * 100).toFixed(1)}%` : '—'}</p>
                            <p className="text-xs text-gray-400 mt-2">Strict boundaries</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-surface-2 rounded-xl border border-border-default p-6 text-center shadow-card opacity-80">
                    <p className="text-sm text-gray-500 font-mono">
                        🔒 Tenant Intelligence Metrics restricted to Identity Level: Admin
                    </p>
                </div>
            )}

            {/* Urgent Alert */}
            {urgentTickets > 0 && (
                <div
                    className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    onClick={() => navigate('/dashboard/tickets?priority=urgent')}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-800 dark:text-red-200">
                                {urgentTickets} Urgent {urgentTickets === 1 ? 'Ticket' : 'Tickets'} Need Attention
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Click to view and prioritize
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-red-600" />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tickets */}
                <div className="lg:col-span-2 bg-surface-1 rounded-xl shadow-card border border-border-default overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border-strong bg-surface-2">
                        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                            <TicketIcon className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                            Recent Workloads
                        </h2>
                        <button
                            onClick={() => navigate('/dashboard/tickets')}
                            className="text-[10px] font-mono uppercase font-bold flex items-center gap-1 hover:gap-2 transition-all hover:bg-surface-3 px-2 py-1 rounded"
                            style={{ color: primaryColor }}
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {recentTickets.length === 0 ? (
                        <div className="p-8 text-center">
                            <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No tickets yet</p>
                            <button
                                onClick={() => navigate('/dashboard/tickets')}
                                className="mt-3 text-sm font-medium"
                                style={{ color: primaryColor }}
                            >
                                Create your first ticket
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-default">
                            {recentTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="p-4 hover:bg-surface-3 cursor-pointer transition-colors duration-fast"
                                    onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-mono text-gray-500 bg-surface-2 border border-border-strong px-1.5 rounded">
                                                    #{ticket.id.slice(0, 8)}
                                                </span>
                                                <StatusBadge status={ticket.status} />
                                                <PriorityBadge priority={ticket.priority} />
                                            </div>
                                            <p className="font-semibold text-gray-200 truncate">
                                                {ticket.subject}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                                ID: {ticket.creator?.full_name || 'SystemEvent'} • {new Date(ticket.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {ticket.assignee && (
                                            <img
                                                src={ticket.assignee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.assignee.full_name)}&background=random`}
                                                alt={ticket.assignee.full_name}
                                                className="w-8 h-8 rounded-full border border-border-strong"
                                                title={`Assigned to ${ticket.assignee.full_name}`}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Team Stats */}
                    <div className="bg-surface-1 rounded-xl shadow-card border border-border-default p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5" style={{ color: primaryColor }} />
                            Team Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total Members</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{users.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Active Users</span>
                                <span className="font-semibold text-green-600">{activeUsers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Support Staff</span>
                                <span className="font-semibold" style={{ color: primaryColor }}>{supportAgents}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard/users')}
                            className="w-full mt-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                            Manage Team
                        </button>
                    </div>

                    {/* Top Agents */}
                    {topAgents.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <Zap className="w-4 h-4" style={{ color: primaryColor }} />
                                Top Performers
                            </h3>
                            <div className="space-y-3">
                                {topAgents.map((agent, index) => (
                                    <div key={agent.id} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-400 w-4">
                                            {index + 1}
                                        </span>
                                        <img
                                            src={agent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name)}&background=random`}
                                            alt=""
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {agent.full_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {agent.ticketCount} tickets
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/dashboard/tickets')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 border border-transparent hover:border-border-strong transition-all duration-fast text-left"
                            >
                                <TicketIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-300">View All Tickets</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/users')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 border border-transparent hover:border-border-strong transition-all duration-fast text-left"
                            >
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-300">Manage Users</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/slas')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 border border-transparent hover:border-border-strong transition-all duration-fast text-left"
                            >
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-300">Configure SLAs</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/branding')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 border border-transparent hover:border-border-strong transition-all duration-fast text-left"
                            >
                                <BarChart3 className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-300">Customize Branding</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
