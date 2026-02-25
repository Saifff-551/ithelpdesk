import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
    getInvitationByToken,
    acceptInvitation,
    createUserProfile,
    getTenantById
} from '../services/firestore';
import { Invitation, Tenant } from '../types';
import {
    Loader2,
    Mail,
    Building2,
    AlertCircle,
    CheckCircle,
    Clock,
    UserPlus,
    Shield,
} from 'lucide-react';

export const AcceptInvitePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    // State
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fetch invitation on mount
    useEffect(() => {
        const fetchInvitation = async () => {
            if (!token) {
                setError('Invalid invitation link');
                setLoading(false);
                return;
            }

            try {
                const inv = await getInvitationByToken(token);

                if (!inv) {
                    setError('Invitation not found or has been revoked');
                    setLoading(false);
                    return;
                }

                // Check if already accepted
                if (inv.accepted_at) {
                    setError('This invitation has already been used');
                    setLoading(false);
                    return;
                }

                // Check if expired
                if (new Date(inv.expires_at) < new Date()) {
                    setError('This invitation has expired. Please request a new one from your administrator.');
                    setLoading(false);
                    return;
                }

                setInvitation(inv);

                // Fetch tenant info
                const tenantData = await getTenantById(inv.tenant_id);
                setTenant(tenantData);
            } catch (err) {
                console.error('Error fetching invitation:', err);
                setError('Failed to load invitation');
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [token]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!invitation || !tenant) return;

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                invitation.email,
                password
            );

            // Create user profile with tenant_id from invitation
            await createUserProfile(userCredential.user.uid, {
                tenant_id: invitation.tenant_id,
                email: invitation.email,
                full_name: fullName,
                role_id: invitation.role_id,
                is_active: true,
                invited_by: invitation.invited_by,
                invited_at: invitation.created_at,
            });

            // Mark invitation as accepted
            await acceptInvitation(invitation.id);

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            console.error('Error accepting invitation:', err);

            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please log in instead.');
            } else {
                setError(err.message || 'Failed to create account');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Get role display name
    const getRoleLabel = (roleId: string) => {
        const roles: Record<string, string> = {
            'company_admin': 'Administrator',
            'it_manager': 'IT Manager',
            'support_agent': 'Support Agent',
            'employee': 'Employee',
        };
        return roles[roleId] || roleId;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading invitation...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid/expired invitation)
    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Invalid Invitation
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {error}
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${tenant?.primary_color}20` }}
                    >
                        <CheckCircle className="w-8 h-8" style={{ color: tenant?.primary_color }} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to {tenant?.name}!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                        Your account has been created successfully.
                    </p>
                    <p className="text-sm text-gray-400">
                        Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full">
                {/* Header Card */}
                <div
                    className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl p-6 border-b-4"
                    style={{ borderBottomColor: tenant?.primary_color || '#9213ec' }}
                >
                    <div className="flex items-center gap-4">
                        {tenant?.logo_url ? (
                            <img
                                src={tenant.logo_url}
                                alt={tenant.name}
                                className="h-12 w-12 object-contain rounded-xl"
                            />
                        ) : (
                            <div
                                className="h-12 w-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${tenant?.primary_color}20` }}
                            >
                                <Building2 className="w-6 h-6" style={{ color: tenant?.primary_color }} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Join {tenant?.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                You've been invited to the MATIE Control Plane
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl p-6">
                    {/* Invitation Details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-gray-500">Email</p>
                                <p className="font-medium text-gray-900 dark:text-white">{invitation?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm mt-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-gray-500">Role</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {getRoleLabel(invitation?.role_id || '')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Your Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Create Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Min 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm your password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: tenant?.primary_color || '#9213ec' }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account & Join
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium hover:underline" style={{ color: tenant?.primary_color }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
