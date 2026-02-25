import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import {
  getTickets,
  getTicketStats,
  createTicket,
  TicketFilters,
} from '../services/tickets';
import { getUsersByTenant } from '../services/firestore';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  Profile,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
} from '../types';
import {
  Search,
  Plus,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = ({ title, value, icon, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4 shadow-sm border border-gray-200`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
    </div>
  </div>
);

// Status Badge Component
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles: Record<TicketStatus, string> = {
    created: 'bg-surface-3 text-gray-400 border-border-default',
    routing_pending: 'bg-status-info/10 text-status-info border-status-info/20',
    routing_in_progress: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    assigned: 'bg-primary/10 text-primary border-primary/20',
    degraded_assigned: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
    unassigned: 'bg-status-critical/10 text-status-critical border-status-critical/20',
    failed: 'bg-status-critical/20 text-status-critical border-status-critical/30',
    open: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-900/20 text-green-400 border-green-500/30',
    closed: 'bg-surface-2 text-gray-500 border-border-strong',
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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono font-bold border ${styles[status]}`}
    >
      {status === 'routing_in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse"></span>}
      {labels[status]}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const styles: Record<TicketPriority, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };

  const icons: Record<TicketPriority, React.ReactNode> = {
    low: null,
    medium: <AlertTriangle className="w-3 h-3" />,
    high: <AlertTriangle className="w-4 h-4" />,
    urgent: <AlertTriangle className="w-4 h-4 animate-pulse" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${styles[priority]} capitalize`}>
      {icons[priority]}
      {priority}
    </span>
  );
};

// SLA Indicator Component
const SLAIndicator: React.FC<{ deadline?: string }> = ({ deadline }) => {
  if (!deadline) return <span className="text-gray-400 text-xs">No SLA</span>;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const hoursRemaining = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (hoursRemaining < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
        <Clock className="w-3 h-3" />
        Breached
      </span>
    );
  }

  if (hoursRemaining < 2) {
    return (
      <span className="inline-flex items-center gap-1 text-orange-600 text-xs font-medium animate-pulse">
        <Clock className="w-3 h-3" />
        {hoursRemaining}h left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
      <Clock className="w-3 h-3" />
      {hoursRemaining}h left
    </span>
  );
};

// Create Ticket Modal
const CreateTicketModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  tenantId: string;
  userId: string;
}> = ({ isOpen, onClose, onSubmit, tenantId, userId }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'software' as TicketCategory,
    priority: 'medium' as TicketPriority,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        tenant_id: tenantId,
        creator_id: userId,
      });
      setFormData({ subject: '', description: '', category: 'software', priority: 'medium' });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of your issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
              placeholder="Please provide details about your issue..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main TicketList Component
export const TicketList: React.FC = () => {
  const { profile, tenant, user } = useAuth();
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  // Determine if user can see all tickets or just their own
  const canSeeAllTickets = profile?.role_id && ['platform_admin', 'company_admin', 'it_manager', 'support_agent'].includes(profile.role_id);

  // Fetch tickets
  useEffect(() => {
    const fetchData = async () => {
      if (!tenant?.id) return;

      setLoading(true);
      try {
        // For employees, only fetch their own tickets
        const ticketFilters: TicketFilters = canSeeAllTickets
          ? filters
          : { ...filters, creator_id: user?.uid };

        const [ticketsData, statsData] = await Promise.all([
          getTickets(tenant.id, ticketFilters),
          getTicketStats(tenant.id),
        ]);

        setTickets(ticketsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant?.id, filters, canSeeAllTickets, user?.uid]);

  // Filter tickets by search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.creator?.full_name?.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  // Paginated tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ticketsPerPage;
    return filteredTickets.slice(startIndex, startIndex + ticketsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  // Handle ticket creation
  const handleCreateTicket = async (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
    const newTicket = await createTicket(ticketData);
    setTickets((prev) => [newTicket, ...prev]);
    setStats((prev) => ({ ...prev, total: prev.total + 1, open: prev.open + 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 text-sm mt-1">
            {canSeeAllTickets ? 'Manage all support tickets' : 'View and track your support requests'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          style={{ backgroundColor: tenant?.primary_color }}
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Filter className="w-6 h-6 text-gray-600" />}
          color="text-gray-900"
          bgColor="bg-white"
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="In Progress"
          value={stats.in_progress}
          icon={<Loader2 className="w-6 h-6 text-yellow-600" />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters || Object.keys(filters).length > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as TicketStatus || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value as TicketPriority || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value as TicketCategory || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Requester
                </th>
                {canSeeAllTickets && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assignee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="w-12 h-12 text-gray-300" />
                      <p className="font-medium">No tickets found</p>
                      <p className="text-sm">
                        {searchQuery || Object.keys(filters).length > 0
                          ? 'Try adjusting your filters'
                          : 'Create your first ticket to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            ticket.creator?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              ticket.creator?.full_name || 'U'
                            )}&background=random`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-900">
                          {ticket.creator?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    {canSeeAllTickets && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.assignee?.full_name || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SLAIndicator deadline={ticket.sla_deadline} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ticketsPerPage + 1} to{' '}
              {Math.min(currentPage * ticketsPerPage, filteredTickets.length)} of {filteredTickets.length}{' '}
              tickets
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTicket}
        tenantId={tenant?.id || ''}
        userId={user?.uid || ''}
      />
    </div>
  );
};
