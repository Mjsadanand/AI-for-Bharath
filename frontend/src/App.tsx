import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClinicalDocsPage from './pages/clinical/ClinicalDocsPage';
import TranslatorPage from './pages/translator/TranslatorPage';
import PredictivePage from './pages/predictive/PredictivePage';
import ResearchPage from './pages/research/ResearchPage';
import WorkflowPage from './pages/workflow/WorkflowPage';
import PatientsPage from './pages/patients/PatientsPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />

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
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
