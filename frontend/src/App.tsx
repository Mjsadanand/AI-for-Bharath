import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SelectRolePage from './pages/auth/SelectRolePage';
import CompleteProfilePage from './pages/auth/CompleteProfilePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClinicalDocsPage from './pages/clinical/ClinicalDocsPage';
import TranslatorPage from './pages/translator/TranslatorPage';
import PredictivePage from './pages/predictive/PredictivePage';
import ResearchPage from './pages/research/ResearchPage';
import WorkflowPage from './pages/workflow/WorkflowPage';
import PatientsPage from './pages/patients/PatientsPage';
import PipelinePage from './pages/pipeline/PipelinePage';
import MyReportsPage from './pages/patient/MyReportsPage';

export default function App() {
  const { user } = useAuth();

  // Helper: where should a logged-in user go?
  const getDefaultRedirect = () => {
    if (!user) return '/';
    if (!user.isProfileComplete) return '/select-role';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={user ? <Navigate to={getDefaultRedirect()} replace /> : <LandingPage />} />

      {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getDefaultRedirect()} replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={getDefaultRedirect()} replace />} />

      {/* Google OAuth flow — role selection & profile completion (requires login, but not complete profile) */}
      <Route path="/select-role" element={<SelectRolePage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />

      {/* Protected routes inside dashboard layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <PatientsPage />
            </ProtectedRoute>
          } />
          <Route path="/clinical-docs" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <ClinicalDocsPage />
            </ProtectedRoute>
          } />
          <Route path="/translator" element={<TranslatorPage />} />
          <Route path="/my-reports" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MyReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/predictive" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <PredictivePage />
            </ProtectedRoute>
          } />
          <Route path="/research" element={
            <ProtectedRoute allowedRoles={['doctor', 'researcher', 'admin']}>
              <ResearchPage />
            </ProtectedRoute>
          } />
          <Route path="/workflow" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <WorkflowPage />
            </ProtectedRoute>
          } />
          <Route path="/pipeline" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <PipelinePage />
            </ProtectedRoute>
          } />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={user ? getDefaultRedirect() : '/'} replace />} />
    </Routes>
  );
}
