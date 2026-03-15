import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, isAdmin, loading } = useAuth();

  // Auth state still initializing
  if (loading) return <Spinner />;

  // Not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // User authenticated but profile still loading
  // (loading is false but profile fetch might still be in progress
  //  if onAuthStateChange just fired — give it a moment via loading state)
  // With the new AuthContext, loading stays true until profile is fetched,
  // so this case means profile fetch genuinely failed.
  // Let the user through with basic access rather than blocking forever.

  // Admin-only route check
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
