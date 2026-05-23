import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AgentLayout from '../../components/layout/AgentLayout';
import AgentProtectedRoute from '../../contexts/AgentProtectedRoute';

// Agent Pages
import AgentDashboard from './DashboardEnhanced';
import AgentClients from './AgentClients';
// import AgentClients from './AgentClients';
// import AgentApplications from './AgentApplications';
// import AgentPerformance from './AgentPerformance';
// import AgentMessages from './AgentMessages';
// import AgentCalendar from './AgentCalendar';
// import AgentSettings from './AgentSettings';

const AgentPanel = () => {
  return (
    <AgentProtectedRoute>
      <AgentLayout>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          
          {/* Agent Routes */}
          <Route path="dashboard" element={<AgentDashboard />} />
           <Route path="clients" element={<AgentClients />} />
          {/*<Route path="applications" element={<AgentApplications />} />
          <Route path="performance" element={<AgentPerformance />} />
          <Route path="messages" element={<AgentMessages />} />
          <Route path="calendar" element={<AgentCalendar />} />
          <Route path="settings" element={<AgentSettings />} /> */}
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </AgentLayout>
    </AgentProtectedRoute>
  );
};

export default AgentPanel;