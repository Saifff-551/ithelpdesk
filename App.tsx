import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './services/TenantContext';
import { AuthProvider } from './services/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { V2ControlPlane } from './components/V2ControlPlane';
import { Loader2 } from 'lucide-react';

// Eagerly loaded pages (critical path)
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { DashboardLayout } from './components/DashboardLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { TicketList } from './pages/TicketList';
import { TicketDetails } from './pages/TicketDetails';

// Lazy-loaded pages (non-critical, reduce initial bundle)
const BrandingPage = lazy(() => import('./pages/BrandingPage').then(m => ({ default: m.BrandingPage })));
const SlaPage = lazy(() => import('./pages/SlaPage').then(m => ({ default: m.SlaPage })));
const KbPage = lazy(() => import('./pages/KbPage').then(m => ({ default: m.KbPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const PlatformAdminPage = lazy(() => import('./pages/PlatformAdminPage').then(m => ({ default: m.PlatformAdminPage })));
const PitchPage = lazy(() => import('./pages/PitchPage').then(m => ({ default: m.PitchPage })));
const PatentPage = lazy(() => import('./pages/PatentPage').then(m => ({ default: m.PatentPage })));

// Suspense fallback for lazy-loaded routes
const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TenantProvider>
        <AuthProvider>
          <V2ControlPlane>
            <Router>
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                  <Route path="/pitch" element={<PitchPage />} />
                  <Route path="/patent" element={<PatentPage />} />

                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="tickets" element={<TicketList />} />
                    <Route path="tickets/:id" element={<TicketDetails />} />
                    <Route path="kb" element={<KbPage />} />
                    <Route path="users" element={
                      <ProtectedRoute allowedRoles={['platform_admin', 'company_admin', 'it_manager']}>
                        <UsersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="slas" element={
                      <ProtectedRoute allowedRoles={['platform_admin', 'company_admin', 'it_manager']}>
                        <SlaPage />
                      </ProtectedRoute>
                    } />
                    <Route path="branding" element={
                      <ProtectedRoute allowedRoles={['platform_admin', 'company_admin']}>
                        <BrandingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="admin" element={
                      <ProtectedRoute allowedRoles={['platform_admin']}>
                        <PlatformAdminPage />
                      </ProtectedRoute>
                    } />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </V2ControlPlane>
        </AuthProvider>
      </TenantProvider>
    </ErrorBoundary>
  );
};

export default App;
