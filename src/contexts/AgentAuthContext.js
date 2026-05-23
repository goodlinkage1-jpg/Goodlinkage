import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Axiosinstance from '../pages/AgentDashboard/AxiosInstance'; // Use your configured instance

// Create a context for agent authentication
const AgentAuthContext = createContext();

export const useAgentAuth = () => {
  return useContext(AgentAuthContext);
}; 

export const AgentAuthProvider = ({ children }) => {
  const [agentUser, setAgentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAgentAuthenticated, setIsAgentAuthenticated] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check agent auth on mount and when accessing agent routes
  useEffect(() => {
    const checkAgentAuth = async () => {
      // If not on agent route, just set loading to false and return
      if (!location.pathname.startsWith('/agent')) {
        setLoading(false);
        setInitialCheckComplete(true);
        return;
      }

      // Don't check again if we're already authenticated and this isn't the initial check
      if (isAgentAuthenticated && initialCheckComplete) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const token = localStorage.getItem('agentAccessToken');
        const agentInfo = localStorage.getItem('agentInfo');
        const refreshToken = localStorage.getItem('agentRefreshToken');
        
        if (!token || !agentInfo || !refreshToken) {
          console.log('❌ Missing agent tokens or info');
          setIsAgentAuthenticated(false);
          setAgentUser(null);
          setLoading(false);
          setInitialCheckComplete(true);
          return;
        }

        // Parse stored agent info first
        const parsedAgentInfo = JSON.parse(agentInfo);
        
        // Set the user immediately from localStorage
        setAgentUser(parsedAgentInfo);
        setIsAgentAuthenticated(true);
        
        // Then validate the token in the background
        console.log('🔐 Validating agent access token...');
        const response = await Axiosinstance.get('/agent/profile');
        
        if (response.data.success) {
          // Update with fresh data from server
          setAgentUser(response.data.data);
          setIsAgentAuthenticated(true);
          console.log('✅ Agent authenticated successfully');
        } else {
          // If validation fails, clear everything
          clearAgentAuth();
        }
      } catch (error) {
        console.error('❌ Agent auth check failed:', error);
        
        // Only clear auth if it's a definitive auth failure (401)
        // Don't clear on network errors or other issues
        if (error.response?.status === 401) {
          console.log('🔄 Agent auth check failed, clearing tokens');
          clearAgentAuth();
        } else {
          // For network errors, keep the user logged in but log the error
          console.log('🌐 Network error during auth check, keeping user logged in');
        }
      } finally {
        setLoading(false);
        setInitialCheckComplete(true);
      }
    };
    
    checkAgentAuth();
  }, [location.pathname]); // Remove isAgentAuthenticated and initialCheckComplete from dependencies

  // Helper function to clear authentication
  const clearAgentAuth = () => {
    localStorage.removeItem('agentAccessToken');
    localStorage.removeItem('agentRefreshToken');
    localStorage.removeItem('agentInfo');
    setIsAgentAuthenticated(false);
    setAgentUser(null);
  };

  // Login function
  const loginAgent = async (email, password) => {
    try {
      console.log('🔐 Attempting agent login...');
      const response = await Axiosinstance.post('/agent/login', {
        email,
        password
      });
      
      if (response.data.success) {
        // Store tokens and agent info
        localStorage.setItem('agentAccessToken', response.data.data.accessToken);
        localStorage.setItem('agentRefreshToken', response.data.data.refreshToken);
        localStorage.setItem('agentInfo', JSON.stringify(response.data.data.agent));
        
        setAgentUser(response.data.data.agent);
        setIsAgentAuthenticated(true);
        
        console.log('✅ Agent login successful');
        
        // Navigate to agent dashboard after successful login
        navigate('/agent/dashboard');
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('❌ Agent login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logoutAgent = async () => {
    try {
      // Get refresh token for logout API call
      const refreshToken = localStorage.getItem('agentRefreshToken');
      
      // Try to call logout API
      await Axiosinstance.post('/agent/logout', {
        refreshToken
      });
      
      console.log('📤 Agent logout API called successfully');
    } catch (error) {
      console.error('❌ Agent logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all stored data
      clearAgentAuth();
      
      console.log('🚪 Agent logged out');
      navigate('/agent/login');
    }
  };

  const value = {
    agentUser,
    loading,
    isAgentAuthenticated,
    loginAgent,
    logoutAgent
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children || <Outlet />}
    </AgentAuthContext.Provider>
  );
};