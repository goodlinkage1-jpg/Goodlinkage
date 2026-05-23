import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAgentAuth } from './AgentAuthContext';

const AgentProtectedRoute = ({ children }) => {
  const { isAgentAuthenticated, loading } = useAgentAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAgentAuthenticated) {
    return <Navigate to="/Agent/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AgentProtectedRoute;