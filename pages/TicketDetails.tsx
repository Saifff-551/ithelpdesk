import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import {
  getTicketById,
  updateTicket,
  getTicketComments,
  addComment,
} from '../services/tickets';
import { getUsersByTenant } from '../services/firestore';
import {
  Ticket,
  TicketComment,
  TicketStatus,
  TicketPriority,
  Profile,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from '../types';
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  Tag,
  CheckCircle,
  MessageSquare,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { RoutingTransparencyPanel } from '../components/matie/RoutingTransparencyPanel';

// Status Badge Component
const StatusBadge: React.FC<{ status: TicketStatus; large?: boolean }> = ({ status, large }) => {
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
      className={`inline-flex items-center gap-1.5 rounded uppercase tracking-wider font-mono font-bold border ${styles[status]} ${large ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
        }`}
    >
      {status === 'routing_in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse"></span>}
      {labels[status]}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const styles: Record<TicketPriority, { bg: string; text: string }> = {
    low: { bg: 'bg-green-100', text: 'text-green-700' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700' },
    urgent: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[priority].bg} ${styles[priority].text} capitalize`}
    >
      {priority === 'urgent' || priority === 'high' ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : null}
      {priority}
    </span>
  );
};

// Comment Component
const CommentBubble: React.FC<{
  comment: TicketComment;
  isCurrentUser: boolean;
  isSupportStaff: boolean;
}> = ({ comment, isCurrentUser, isSupportStaff }) => {
  const isInternal = comment.is_internal;

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isInternal ? 'opacity-75' : ''
        }`}
    >
      <div
        className={`max-w-[80%] ${isCurrentUser
          ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl'
          : isInternal
            ? 'bg-amber-50 border border-amber-200 text-gray-800 rounded-r-xl rounded-tl-xl'
            : 'bg-gray-100 text-gray-800 rounded-r-xl rounded-tl-xl'
          } p-4 shadow-sm`}
      >
        {isInternal && (
          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mb-2">
            <EyeOff className="w-3 h-3" />
            Internal Note
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        <div
          className={`mt-2 flex items-center gap-2 text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'
            }`}
        >
          <span className="font-medium">{comment.author?.full_name || 'Unknown'}</span>
          <span>•</span>
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// Main TicketDetails Component
export const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, tenant, user } = useAuth();

  // State
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Determine user permissions
  const isSupportStaff =
    profile?.role_id &&
    ['platform_admin', 'company_admin', 'it_manager', 'support_agent'].includes(profile.role_id);
  const canEdit =
    profile?.role_id &&
    ['platform_admin', 'company_admin', 'it_manager', 'support_agent'].includes(profile.role_id);
  const isTicketCreator = user?.uid === ticket?.creator_id;

  // Fetch ticket data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !tenant?.id) return;

      setLoading(true);
      try {
        const [ticketData, commentsData, usersData] = await Promise.all([
          getTicketById(id),
          getTicketComments(id),
          getUsersByTenant(tenant.id),
        ]);

        setTicket(ticketData);
        // Filter internal notes for non-staff
        setComments(
          isSupportStaff
            ? commentsData
            : commentsData.filter((c) => !c.is_internal)
        );
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, tenant?.id, isSupportStaff]);

  // Handle status change
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !canEdit) return;

    setUpdating(true);
    try {
      await updateTicket(ticket.id, { status: newStatus });
      setTicket({ ...ticket, status: newStatus, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket || !canEdit) return;

    setUpdating(true);
    try {
      await updateTicket(ticket.id, { priority: newPriority });
      setTicket({ ...ticket, priority: newPriority, updated_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (assigneeId: string) => {
    if (!ticket || !canEdit) return;

    setUpdating(true);
    try {
      await updateTicket(ticket.id, {
        assignee_id: assigneeId || undefined,
      });
      const newAssignee = users.find((u) => u.id === assigneeId);
      setTicket({
        ...ticket,
        assignee_id: assigneeId || undefined,
        assignee: newAssignee,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating assignee:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !user || !newComment.trim()) return;

    setSendingComment(true);
    try {
      const comment = await addComment(ticket.id, {
        ticket_id: ticket.id,
        author_id: user.uid,
        content: newComment.trim(),
        is_internal: isInternalNote && isSupportStaff,
      });
      setComments([...comments, comment]);
      setNewComment('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  // Get support agents for assignment dropdown
  const supportAgents = users.filter((u) =>
    ['support_agent', 'it_manager', 'company_admin'].includes(u.role_id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-gray-500">Ticket not found</p>
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>
      </div>
    );
  }

  // SLA remaining calculation
  const getSLARemaining = () => {
    if (!ticket.sla_deadline) return null;
    const deadline = new Date(ticket.sla_deadline);
    const now = new Date();
    const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      ((deadline.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (hoursRemaining < 0) {
      return { text: 'SLA Breached', color: 'text-red-600 bg-red-50' };
    }
    if (hoursRemaining < 2) {
      return { text: `${hoursRemaining}h ${minutesRemaining}m remaining`, color: 'text-orange-600 bg-orange-50' };
    }
    return { text: `${hoursRemaining}h ${minutesRemaining}m remaining`, color: 'text-gray-600 bg-gray-50' };
  };

  const slaInfo = getSLARemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
            <StatusBadge status={ticket.status} large />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          {ticket.status === 'assigned' && ticket.mfis_factors && ticket.mfis_weights && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-standard">
              <RoutingTransparencyPanel
                factors={ticket.mfis_factors}
                weights={ticket.mfis_weights}
                confidence={ticket.ai_confidence || 0.85}
                auditTraceId={ticket.audit_trace_id || `TRC-${ticket.id.slice(0, 8).toUpperCase()}`}
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Description
            </h2>
            <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </h2>
            </div>

            {/* Comments List */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Start the conversation below.
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentBubble
                    key={comment.id}
                    comment={comment}
                    isCurrentUser={comment.author_id === user?.uid}
                    isSupportStaff={!!isSupportStaff}
                  />
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200">
              {isSupportStaff && (
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" />
                    Internal note (only visible to support team)
                  </span>
                </label>
              )}
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isInternalNote ? 'Add an internal note...' : 'Type your reply...'}
                  className={`flex-1 px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:border-transparent ${isInternalNote
                    ? 'border-amber-300 bg-amber-50 focus:ring-amber-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: tenant?.primary_color }}
                >
                  {sendingComment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Properties */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              {canEdit ? (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              {canEdit ? (
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
              {canEdit ? (
                <select
                  value={ticket.assignee_id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {supportAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.full_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {ticket.assignee?.full_name || 'Unassigned'}
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="capitalize text-gray-700">{ticket.category}</span>
              </div>
            </div>

            {/* SLA */}
            {slaInfo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SLA</label>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${slaInfo.color}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{slaInfo.text}</span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Requester</span>
                <div className="flex items-center gap-2">
                  <img
                    src={
                      ticket.creator?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        ticket.creator?.full_name || 'U'
                      )}&background=random`
                    }
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-gray-700 font-medium">
                    {ticket.creator?.full_name || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-700">
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Ticket ID</span>
                <span className="text-gray-700 font-mono text-xs">{ticket.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {canEdit && ticket.status !== 'closed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {ticket.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4" />
                    Start Working
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                )}
                {ticket.status === 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
