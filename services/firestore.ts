import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    Timestamp,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db, createCollection, createTenantQuery } from './firebase';
import type {
    Tenant,
    Profile,
    SLA,
    Invitation,
    TenantSettings,
    RoleId,
    AuditLog,
    AIDecisionLog
} from '../types';
import { DEFAULT_TENANT_SETTINGS, DEFAULT_SLAS } from '../types';

// Type definitions for Firestore documents
export interface FirestoreTenant extends Omit<Tenant, 'id' | 'created_at' | 'updated_at'> {
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface FirestoreProfile extends Omit<Profile, 'id' | 'created_at'> {
    created_at?: Timestamp;
}

// Helper to convert timestamp
const timestampToISO = (timestamp?: Timestamp): string => {
    return timestamp?.toDate().toISOString() || new Date().toISOString();
};

// ============================================
// TENANT OPERATIONS
// ============================================

export interface CreateTenantInput {
    name: string;
    subdomain: string;
    custom_domain?: string;
    website_url?: string;  // Company website for AI branding
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    admin_email?: string;
    admin_name?: string;
}

/**
 * Create a new tenant with all default configurations
 */
export const createTenantWithDefaults = async (
    input: CreateTenantInput
): Promise<Tenant> => {
    const batch = writeBatch(db);

    // Generate tenant ID
    const tenantRef = doc(collection(db, 'tenants'));
    const tenantId = tenantRef.id;

    // Create tenant document
    const tenantData: Omit<Tenant, 'id'> = {
        name: input.name,
        subdomain: input.subdomain.toLowerCase(),
        primary_color: input.primary_color || '#9213ec',
        secondary_color: input.secondary_color || '#7a10c4',
        timezone: 'UTC',
        language: 'en',
        settings: DEFAULT_TENANT_SETTINGS,
        is_active: true,
        created_at: new Date().toISOString(),
    };

    // Add optional fields only if they have defined values
    if (input.custom_domain) {
        tenantData.custom_domain = input.custom_domain.toLowerCase();
    }
    if (input.website_url) {
        tenantData.website_url = input.website_url;
    }
    if (input.logo_url) {
        tenantData.logo_url = input.logo_url;
    }

    batch.set(tenantRef, {
        ...tenantData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });

    // Create default SLAs
    for (const slaConfig of DEFAULT_SLAS) {
        const slaRef = doc(collection(db, 'slas'));
        batch.set(slaRef, {
            tenant_id: tenantId,
            name: `${slaConfig.priority.charAt(0).toUpperCase() + slaConfig.priority.slice(1)} Priority SLA`,
            priority: slaConfig.priority,
            response_time_hours: slaConfig.response_hours,
            resolution_time_hours: slaConfig.resolution_hours,
            is_active: true,
            created_at: serverTimestamp(),
        });
    }

    // Commit all writes
    await batch.commit();

    return {
        id: tenantId,
        ...tenantData,
    } as Tenant;
};

/**
 * Legacy createTenant for backward compatibility
 */
export const createTenant = async (tenantData: Omit<Tenant, 'id' | 'created_at' | 'subdomain' | 'timezone' | 'language' | 'is_active'> & { subdomain?: string }) => {
    return createTenantWithDefaults({
        name: tenantData.name,
        subdomain: tenantData.subdomain || tenantData.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color,
        secondary_color: tenantData.secondary_color,
    });
};

export const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
    try {
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        if (!tenantDoc.exists()) return null;

        const data = tenantDoc.data() as FirestoreTenant;
        return {
            id: tenantDoc.id,
            ...data,
            created_at: timestampToISO(data.created_at),
            updated_at: data.updated_at ? timestampToISO(data.updated_at) : undefined,
        } as Tenant;
    } catch (error) {
        console.error('Error getting tenant:', error);
        throw error;
    }
};

export const updateTenant = async (tenantId: string, updates: Partial<Tenant>) => {
    try {
        const tenantRef = doc(db, 'tenants', tenantId);
        await updateDoc(tenantRef, {
            ...updates,
            updated_at: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating tenant:', error);
        throw error;
    }
};

// ============================================
// USER PROFILE OPERATIONS
// ============================================

export const createUserProfile = async (
    userId: string,
    profileData: Omit<Profile, 'id' | 'created_at' | 'is_active'> & { is_active?: boolean }
) => {
    try {
        await setDoc(doc(db, 'users', userId), {
            ...profileData,
            is_active: profileData.is_active ?? true,
            created_at: serverTimestamp(),
        });
        return { id: userId, ...profileData, is_active: true };
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return null;

        const data = userDoc.data() as FirestoreProfile;
        return {
            id: userDoc.id,
            ...data,
            created_at: data.created_at ? timestampToISO(data.created_at) : undefined,
        } as Profile;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const getUsersByTenant = async (tenantId: string): Promise<Profile[]> => {
    try {
        const usersQuery = createTenantQuery<FirestoreProfile>('users', tenantId);
        const snapshot = await getDocs(usersQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at ? timestampToISO(doc.data().created_at) : undefined,
        })) as Profile[];
    } catch (error) {
        console.error('Error getting users by tenant:', error);
        throw error;
    }
};

// ============================================
// INVITATION OPERATIONS
// ============================================

/**
 * Create an invitation for a new employee
 */
export const createInvitation = async (
    tenantId: string,
    email: string,
    roleId: RoleId,
    invitedBy: string
): Promise<Invitation> => {
    try {
        // Check if invitation already exists for this email
        const existingQuery = query(
            collection(db, 'invitations'),
            where('tenant_id', '==', tenantId),
            where('email', '==', email.toLowerCase()),
            where('accepted_at', '==', null)
        );
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
            throw new Error('An invitation already exists for this email');
        }

        // Check if user already exists in this tenant
        const userQuery = query(
            collection(db, 'users'),
            where('tenant_id', '==', tenantId),
            where('email', '==', email.toLowerCase())
        );
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
            throw new Error('A user with this email already exists in your organization');
        }

        // Generate secure token
        const token = crypto.randomUUID() + '-' + Date.now().toString(36);

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation: Omit<Invitation, 'id'> = {
            tenant_id: tenantId,
            email: email.toLowerCase(),
            role_id: roleId,
            invited_by: invitedBy,
            token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'invitations'), invitation);

        return {
            id: docRef.id,
            ...invitation,
        };
    } catch (error) {
        console.error('Error creating invitation:', error);
        throw error;
    }
};

/**
 * Get invitation by token
 */
export const getInvitationByToken = async (token: string): Promise<Invitation | null> => {
    try {
        const q = query(
            collection(db, 'invitations'),
            where('token', '==', token)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as Invitation;
    } catch (error) {
        console.error('Error getting invitation:', error);
        throw error;
    }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (invitationId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'invitations', invitationId), {
            accepted_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw error;
    }
};

/**
 * Get pending invitations for a tenant
 */
export const getPendingInvitations = async (tenantId: string): Promise<Invitation[]> => {
    try {
        const q = query(
            collection(db, 'invitations'),
            where('tenant_id', '==', tenantId),
            where('accepted_at', '==', null)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Invitation[];
    } catch (error) {
        console.error('Error getting pending invitations:', error);
        throw error;
    }
};

/**
 * Delete/revoke an invitation
 */
export const deleteInvitation = async (invitationId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'invitations', invitationId));
    } catch (error) {
        console.error('Error deleting invitation:', error);
        throw error;
    }
};

// ============================================
// SLA OPERATIONS
// ============================================

export const getSLAsByTenant = async (tenantId: string): Promise<SLA[]> => {
    try {
        const slasQuery = createTenantQuery<SLA>('slas', tenantId);
        const snapshot = await getDocs(slasQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as SLA[];
    } catch (error) {
        console.error('Error getting SLAs:', error);
        throw error;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const deleteDocument = async (collectionName: string, docId: string) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        return { success: true };
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw error;
    }
};

// ============================================
// MATIE AI & AUDIT LOG OPERATIONS
// ============================================

/**
 * Creates an immutable AI decision log for explainability.
 */
export const createAIDecisionLog = async (
    logData: Omit<AIDecisionLog, 'id' | 'timestamp'>
): Promise<AIDecisionLog> => {
    try {
        const docRef = await addDoc(collection(db, 'ai_decision_logs'), {
            ...logData,
            timestamp: serverTimestamp(),
        });
        return {
            id: docRef.id,
            ...logData,
            timestamp: timestampToISO(Timestamp.now()), // Approximate for immediate return
        };
    } catch (error) {
        console.error('Error creating AI decision log:', error);
        throw error;
    }
};

/**
 * Creates an immutable audit log for system and lifecycle events.
 */
export const createAuditLog = async (
    logData: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> => {
    try {
        const docRef = await addDoc(collection(db, 'audit_logs'), {
            ...logData,
            timestamp: serverTimestamp(),
        });
        return {
            id: docRef.id,
            ...logData,
            timestamp: timestampToISO(Timestamp.now()),
        };
    } catch (error) {
        console.error('Error creating audit log:', error);
        throw error;
    }
};
