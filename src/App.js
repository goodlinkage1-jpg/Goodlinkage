import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AgentAuthProvider } from './contexts/AgentAuthContext';
import { PostProvider } from './contexts/PostContext';

// Pages
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import HomePage from './pages/HomePage';
import NetworkPage from './pages/NetworkPage';
import CreateJob from './pages/CreateJob';
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyCvPage from './pages/MyCv';
import JobPage from './pages/JobPage';
import JobDetailPage from './pages/JobDetailPage';
import ViewCandidatesPage from './pages/ViewCandidatesPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import MyMarketPage from './pages/MyMarketPage';
import UserProfilePage from './pages/UserProfilePage';
import AddnetworkPage from './pages/AddnetworkPage';
import AuthSuccess from './contexts/AuthSuccess';
import AdminLoginPage from './pages/Dashboard/AdminLogin';
import RealEstateDashboard from './pages/RealEstateDashboard';
import PropertiesMapView from './pages/PropertiesMapView';

// Admin Panel Pages
import AdminPanel from './pages/Dashboard/AdminPanel';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Dashboard/UserManagement';
import AgentManagement from './pages/Dashboard/AgentManagement';
import CountryReports from './pages/Dashboard/CountryReports';
import AgentPerformance from './pages/Dashboard/AgentPerformance';
import Settings from './pages/Dashboard/Settings';

// Agent Panel Pages
import AgentPanel from './pages/AgentDashboard/AgentPanel';
import AgentDashboard from './pages/AgentDashboard/Dashboard';
import AgentClients from './pages/AgentDashboard/AgentClients';

// Protected Route Components
import AdminProtectedRoute from './contexts/AdminProtectedRoute';
import AgentProtectedRoute from './contexts/AgentProtectedRoute';

// Chatroom
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-700 text-lg">Loading...</p>
    </div>
  </div>
);

// Protected Route Component with refresh token support
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  
  // Show loading screen while authentication is being checked
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the protected content
  return children;
};

// Commissioner-Only Protected Route Component
const CommissionerProtectedRoute = ({ children }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  
  // Show loading screen while authentication is being checked
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is a commissioner
  if (currentUser?.accounttype !== 'commissioner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This feature is exclusively available for commissioners.</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
            Go to Home
          </a>
        </div>
      </div>
    );
  }
  
  // User is authenticated and is a commissioner, render the protected content
  return children;
};

// Agent Login Page Component
const AgentLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { loginAgent, isAgentAuthenticated, loading } = useAgentAuth();
  
  // If already authenticated, redirect to agent dashboard
  useEffect(() => {
    if (isAgentAuthenticated && !loading) {
      navigate('/agent/dashboard');
    }
  }, [isAgentAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    // Clear any previous errors
    setError('');
    setIsLoading(true);
    
    try {
      const result = await loginAgent(email, password);
      if (!result.success) {
        setError(result.message || 'Invalid agent credentials');
      }
    } catch (error) {
      console.error('Agent login error:', error);
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };
  
  // If still checking auth status, show loading
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-green-600">Good Linkage</h1>
          <h2 className="text-2xl mt-2">Agent Login</h2>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Agent Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-lg font-semibold transition duration-200`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Login as Agent'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to User Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// App Routes Component (separated from AuthProvider to use useAuth hook)
const AppRoutes = () => {
  return (
    <PostProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<CreateAccountPage />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
       
        {/* Public Admin Route */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* Public Agent Route */}
        <Route path="/agent/login" element={<LoginPage />} />
        
        {/* Admin Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminPanel />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="agents" element={<AgentManagement />} />
          <Route path="reports/country" element={<CountryReports />} />
          <Route path="reports/performance" element={<AgentPerformance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Agent Protected Routes */}
        <Route
        
          path="/agent/*"
          element={
            <AgentProtectedRoute>
              <AgentPanel />
            </AgentProtectedRoute>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="clients" element={<AgentClients />} />
          {/* Add more agent routes here as needed */}
        </Route>
       
        {/* User Protected Routes */}
        <Route path="/network" element={
          <ProtectedRoute>
            <NetworkPage />
          </ProtectedRoute>
        } />
       
        <Route path="/job" element={
          <ProtectedRoute>
            <JobPage />
          </ProtectedRoute>
        } />
        <Route path="/marketplace" element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        } />
        
        {/* Real Estate / Land Selling Routes - Commissioner Only */}
        <Route path="/land-selling" element={
          <CommissionerProtectedRoute>
            <RealEstateDashboard />
          </CommissionerProtectedRoute>
        } />
        <Route path="/properties-map" element={
          <ProtectedRoute>
            <PropertiesMapView />
          </ProtectedRoute>
        } />
        <Route path="/addnetwork" element={
          <ProtectedRoute>
            <AddnetworkPage />
          </ProtectedRoute>
        } />
        <Route path="/jobs/:jobId/candidates" element={
          <ProtectedRoute>
            <ViewCandidatesPage />
          </ProtectedRoute>
        }/>
        <Route path="/my-store" element={
          <ProtectedRoute>
            <MyMarketPage />
          </ProtectedRoute>
        } />
        <Route path="/jobs/:jobId" element={
          <ProtectedRoute>
            <JobDetailPage />
          </ProtectedRoute>
        } />
        <Route path='/create-job' element={
          <ProtectedRoute>
          <CreateJob />
        </ProtectedRoute>
        } />
        <Route path='/my-cv' element={
          <ProtectedRoute>
          <MyCvPage />
        </ProtectedRoute>
        } />
        <Route path='/my-applications' element={
          <ProtectedRoute>
          <MyApplicationsPage />
        </ProtectedRoute>
        } />
        <Route path="/my-profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } />
        {/* Chat room routing */}
        <Route path="/groups" element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        } />
        <Route path="/groups/:groupId" element={
          <ProtectedRoute>
            <GroupDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/Homepage" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </PostProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AgentAuthProvider>
          <AppRoutes />
        </AgentAuthProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export default App;