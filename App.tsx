import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './services/TenantContext';
import { AuthProvider } from './services/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { DashboardLayout } from './components/DashboardLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { TicketList } from './pages/TicketList';
import { TicketDetails } from './pages/TicketDetails';
import { BrandingPage } from './pages/BrandingPage';
import { SlaPage } from './pages/SlaPage';
import { KbPage } from './pages/KbPage';
import { UsersPage } from './pages/UsersPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
import { PitchPage } from './pages/PitchPage';
import { PatentPage } from './pages/PatentPage';

export const App: React.FC = () => {
  return (
    // TenantProvider must be outside Router to resolve tenant before any routing
    <TenantProvider>
      <AuthProvider>
        <Router>
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
        </Router>
      </AuthProvider>
    </TenantProvider>
  );
};

export default App;
