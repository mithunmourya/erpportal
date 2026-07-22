import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from './MainLayout';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
          <h1 style={{ color: 'var(--status-danger-text)', fontSize: '3rem' }}>403</h1>
          <h2>Access Denied</h2>
          <p>You are not authorized to view this department workspace.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoute;
