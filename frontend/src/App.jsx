import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AnalystDashboard } from './pages/AnalystDashboard';
import { ComplianceDashboard } from './pages/ComplianceDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Unauthorized } from './pages/Unauthorized';

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'compliance_officer') return <Navigate to="/compliance" replace />;
  return <Navigate to="/analyst" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Analyst Dashboard (accessible by analyst, compliance_officer, admin) */}
          <Route
            path="/analyst"
            element={
              <ProtectedRoute allowedRoles={['analyst', 'compliance_officer', 'admin']}>
                <AnalystDashboard />
              </ProtectedRoute>
            }
          />

          {/* Compliance Dashboard (accessible by compliance_officer and admin) */}
          <Route
            path="/compliance"
            element={
              <ProtectedRoute allowedRoles={['compliance_officer', 'admin']}>
                <ComplianceDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard (accessible by admin only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
