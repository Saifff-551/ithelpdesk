import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { useTenant } from '../services/TenantContext';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Settings,
  LogOut,
  Users,
  ShieldCheck,
  Menu,
  X,
  Building2,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DashboardLayout: React.FC = () => {
  const { profile, tenant, signOut } = useAuth();
  const { tenant: resolvedTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Use resolved tenant if auth tenant not yet loaded
  const activeTenant = tenant || resolvedTenant;
  const primaryColor = activeTenant?.primary_color || '#9213ec';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'] },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket, roles: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'] },
    { name: 'Knowledge Base', href: '/dashboard/kb', icon: BookOpen, roles: ['platform_admin', 'company_admin', 'it_manager', 'support_agent', 'employee'] },
    { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['platform_admin', 'company_admin', 'it_manager'] },
    { name: 'SLAs', href: '/dashboard/slas', icon: Clock, roles: ['platform_admin', 'company_admin', 'it_manager'] },
    { name: 'Branding', href: '/dashboard/branding', icon: Settings, roles: ['platform_admin', 'company_admin'] },
    { name: 'Platform Admin', href: '/dashboard/admin', icon: ShieldCheck, roles: ['platform_admin'] },
  ];

  const filteredNavigation = navigation.filter(item =>
    profile && item.roles.includes(profile.role_id)
  );

  // Get role display name
  const getRoleDisplayName = (roleId: string) => {
    const roleNames: Record<string, string> = {
      'platform_admin': 'Platform Admin',
      'company_admin': 'Admin',
      'it_manager': 'IT Manager',
      'support_agent': 'Support Agent',
      'employee': 'Employee',
    };
    return roleNames[roleId] || roleId;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo / Brand */}
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            {activeTenant?.logo_url ? (
              <img
                className="h-10 w-auto max-w-[180px] object-contain"
                src={activeTenant.logo_url}
                alt={activeTenant.name}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Building2 className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {activeTenant?.name || 'MATIE'}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Control Plane</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  )}
                  style={isActive ? {
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 12px ${primaryColor}40`
                  } : {}}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm"
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=random`}
                alt=""
              />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {profile?.full_name}
              </p>
              <p
                className="text-xs font-medium truncate"
                style={{ color: primaryColor }}
              >
                {getRoleDisplayName(profile?.role_id || '')}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTenant?.logo_url ? (
            <img className="h-8 w-auto" src={activeTenant.logo_url} alt={activeTenant.name} />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Building2 className="h-4 w-4" style={{ color: primaryColor }} />
            </div>
          )}
          <span className="font-semibold text-gray-900 dark:text-white">
            {activeTenant?.name || 'MATIE'}
          </span>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="fixed top-14 left-0 right-0 bottom-0 bg-white dark:bg-gray-800 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="px-4 py-4 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all',
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    style={isActive ? { backgroundColor: primaryColor } : {}}
                  >
                    <item.icon className={cn('mr-4 h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile user section */}
            <div className="mt-auto px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || '')}&background=random`}
                    alt=""
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{getRoleDisplayName(profile?.role_id || '')}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
