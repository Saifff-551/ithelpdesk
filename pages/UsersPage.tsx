import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import {
  getUsersByTenant,
  createInvitation,
  getPendingInvitations,
  deleteInvitation,
  createUserProfile
} from '../services/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Profile, Invitation, RoleId } from '../types';
import {
  Users,
  UserPlus,
  Mail,
  Loader2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Copy,
  Search,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';

// Role display configuration
const ROLES: { id: RoleId; label: string; description: string; color: string }[] = [
  { id: 'company_admin', label: 'Admin', description: 'Full access to all features', color: 'bg-purple-100 text-purple-700' },
  { id: 'it_manager', label: 'IT Manager', description: 'Manage tickets, users, and SLAs', color: 'bg-blue-100 text-blue-700' },
  { id: 'support_agent', label: 'Support Agent', description: 'Handle and resolve tickets', color: 'bg-green-100 text-green-700' },
  { id: 'employee', label: 'Employee', description: 'Create and view own tickets', color: 'bg-gray-100 text-gray-700' },
];

// Modal component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

export const UsersPage: React.FC = () => {
  const { profile, tenant, user } = useAuth();

  // State
  const [users, setUsers] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<RoleId>('employee');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleId>('employee');

  // Check if current user can manage users
  const canManageUsers = profile?.role_id &&
    ['platform_admin', 'company_admin', 'it_manager'].includes(profile.role_id);
  const canCreateAdmins = profile?.role_id &&
    ['platform_admin', 'company_admin'].includes(profile.role_id);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!tenant?.id) return;

      setLoading(true);
      try {
        const [usersData, invitationsData] = await Promise.all([
          getUsersByTenant(tenant.id),
          canManageUsers ? getPendingInvitations(tenant.id) : Promise.resolve([]),
        ]);
        setUsers(usersData);
        setInvitations(invitationsData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant?.id, canManageUsers]);

  // Filter users by search
  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id || !user?.uid) return;

    setModalLoading(true);
    setModalError(null);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);

      // Create user profile
      await createUserProfile(userCredential.user.uid, {
        tenant_id: tenant.id,
        email: newUserEmail,
        full_name: newUserName,
        role_id: newUserRole,
        is_active: true,
        invited_by: user.uid,
        invited_at: new Date().toISOString(),
      });

      // Refresh users list
      const updatedUsers = await getUsersByTenant(tenant.id);
      setUsers(updatedUsers);

      // Reset and close
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('employee');
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setModalError(error.message || 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id || !user?.uid) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const invitation = await createInvitation(tenant.id, inviteEmail, inviteRole, user.uid);
      setInvitations([...invitations, invitation]);

      // Reset and close
      setInviteEmail('');
      setInviteRole('employee');
      setShowInviteModal(false);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setModalError(error.message || 'Failed to send invitation');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle invitation deletion
  const handleDeleteInvite = async (invitationId: string) => {
    try {
      await deleteInvitation(invitationId);
      setInvitations(invitations.filter(i => i.id !== invitationId));
    } catch (error) {
      console.error('Error deleting invitation:', error);
    }
  };

  // Copy invitation link
  const copyInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/accept-invite/${token}`;
    navigator.clipboard.writeText(link);
  };

  // Get role badge
  const getRoleBadge = (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId);
    if (!role) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
        {role.label}
      </span>
    );
  };

  // Available roles for selection (based on current user's role)
  const availableRoles = ROLES.filter(r => {
    if (canCreateAdmins) return true;
    return !['company_admin', 'platform_admin'].includes(r.id);
  });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your organization's users and invitations
          </p>
        </div>

        {canManageUsers && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Invite
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-colors"
              style={{ backgroundColor: tenant?.primary_color || '#9213ec' }}
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Pending Invitations */}
      {canManageUsers && invitations.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getRoleBadge(invitation.role_id)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteLink(invitation.token)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy invitation link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvite(invitation.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Cancel invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                {canManageUsers && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random`}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                          {user.id === profile?.id && (
                            <span className="ml-2 text-xs text-gray-500">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setModalError(null); }}
        title="Add New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Create a new user account. They will be able to log in immediately with these credentials.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as RoleId)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {modalError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {modalError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setModalError(null); }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: tenant?.primary_color || '#9213ec' }}
            >
              {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); setModalError(null); }}
        title="Send Invitation"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Send an invitation email. The user will receive a link to create their account.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as RoleId)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {modalError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {modalError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowInviteModal(false); setModalError(null); }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: tenant?.primary_color || '#9213ec' }}
            >
              {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
