import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, getTenantById } from './firestore';
import { useTenant } from './TenantContext';
import { Profile, Tenant } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tenant context (resolved from URL)
  const { tenant: resolvedTenant, loading: tenantLoading } = useTenant();

  const fetchProfileAndTenant = async (userId: string, retryCount = 0) => {
    try {
      setError(null);

      // Fetch user profile from Firestore
      const profileData = await getUserProfile(userId);

      if (profileData) {
        // TENANT VERIFICATION
        // If we're on a tenant-specific domain, verify the user belongs to this tenant
        if (resolvedTenant && profileData.tenant_id !== resolvedTenant.id) {
          // User trying to access a tenant they don't belong to
          setError('You do not have access to this organization');
          await firebaseSignOut(auth);
          setProfile(null);
          setTenant(null);
          return;
        }

        // Check if user is active
        if (profileData.is_active === false) {
          setError('Your account has been deactivated. Please contact your administrator.');
          await firebaseSignOut(auth);
          setProfile(null);
          setTenant(null);
          return;
        }

        setProfile(profileData);

        // Fetch tenant data (from profile's tenant_id, not URL)
        if (profileData.tenant_id) {
          const tenantData = await getTenantById(profileData.tenant_id);
          if (tenantData) {
            // Check if tenant is explicitly deactivated (undefined = active for backward compatibility)
            if (tenantData.is_active === false) {
              setError('This organization has been deactivated. Please contact support.');
              await firebaseSignOut(auth);
              setProfile(null);
              setTenant(null);
              return;
            }

            setTenant(tenantData);

            // Apply tenant branding to CSS variables
            const root = document.documentElement;
            root.style.setProperty('--primary-color', tenantData.primary_color);
            root.style.setProperty('--secondary-color', tenantData.secondary_color);
            if (tenantData.accent_color) {
              root.style.setProperty('--accent-color', tenantData.accent_color);
            }
          }
        }
      } else {
        // No profile found - user may have auth but no Firestore profile.
        // If we just registered, the profile creation might still be in flight.
        if (retryCount < 3) {
           setTimeout(() => fetchProfileAndTenant(userId, retryCount + 1), 1000);
           return;
        }
        setError('User profile not found. Please complete registration.');
        setProfile(null);
        setTenant(null);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // Firebase permission errors often happen during the split-second between Auth creation and Firestore document creation during registration.
      if (err?.code === 'permission-denied' && retryCount < 3) {
         setTimeout(() => fetchProfileAndTenant(userId, retryCount + 1), 1000);
         return;
      }
      setError('Failed to load user profile');
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Wait for tenant resolution before processing auth
    if (tenantLoading) return;

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchProfileAndTenant(firebaseUser.uid);
      } else {
        setProfile(null);
        setTenant(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [tenantLoading, resolvedTenant]);

  const signOut = async () => {
    setError(null);
    await firebaseSignOut(auth);
    setProfile(null);
    setTenant(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndTenant(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, tenant, loading, error, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to require authentication
 * Throws if user is not authenticated
 */
export const useRequiredAuth = () => {
  const auth = useAuth();
  if (!auth.user || !auth.profile) {
    throw new Error('User must be authenticated');
  }
  return auth as Omit<AuthContextType, 'user' | 'profile'> & {
    user: User;
    profile: Profile;
  };
};
