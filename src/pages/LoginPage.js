import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAgentAuth } from '../contexts/AgentAuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // Get auth contexts with error handling
  const { login, loginWithGoogle, isAuthenticated, loading } = useAuth();
  
  // Try to get admin context, but make it optional
  let adminAuth = null;
  try {
    adminAuth = useAdminAuth();
  } catch (error) {
    console.log('AdminAuthContext not available - admin login disabled');
  }
  
  // Try to get agent context, but make it optional
  let agentAuth = null;
  try {
    agentAuth = useAgentAuth();
  } catch (error) {
    console.log('AgentAuthContext not available - agent login disabled');
  }
  
  const loginAdmin = adminAuth?.loginAdmin;
  const isAdminAuthenticated = adminAuth?.isAdminAuthenticated || false;
  const adminLoading = adminAuth?.loading || false;
  
  const loginAgent = agentAuth?.loginAgent;
  const isAgentAuthenticated = agentAuth?.isAgentAuthenticated || false;
  const agentLoading = agentAuth?.loading || false;
  
  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/Homepage');
    } else if (isAdminAuthenticated && !adminLoading && adminAuth) {
      navigate('/admin/dashboard');
    } else if (isAgentAuthenticated && !agentLoading && agentAuth) {
      navigate('/agent/dashboard');
    }
  }, [isAuthenticated, isAdminAuthenticated, isAgentAuthenticated, loading, adminLoading, agentLoading, navigate, adminAuth, agentAuth]);

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
  // Check if this is admin login
  if (email === 'admin@goodlinkage.com') {
    // Use admin login context if available
    if (loginAdmin) {
      const result = await loginAdmin(email, password);
      if (!result.success) {
        setError(result.message || 'Invalid admin credentials');
      }
    } else {
      setError('Admin login not configured. Please contact administrator.');
    }
  } else if (loginAgent) {
    // Try agent login first
    const result = await loginAgent(email, password);
    if (!result.success) {
      // If agent login fails, try regular user login as fallback
      try {
        await login(email, password);
      } catch (userError) {
        setError('Invalid credentials');
      }
    }
  } else {
    // Try regular user login first
    try {
      await login(email, password);
    } catch (userError) {
      // If user login fails and agent auth is available, try agent login as fallback
      if (loginAgent) {
        const agentResult = await loginAgent(email, password);
        if (!agentResult.success) {
          setError('Invalid credentials');
        }
      } else {
        setError('Invalid credentials');
      }
    }
  }
} catch (error) {
  console.error('Login error:', error);
  setError('Invalid credentials');
} finally {
  setIsLoading(false);
}
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await loginWithGoogle();
      // Redirect will be handled by useEffect
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };
  
  // If still checking auth status, show loading
  if (loading || adminLoading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-blue-600">Good Linkage</h1>
          <h2 className="text-2xl mt-2">Login to Your Account</h2>
          
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-lg font-semibold transition duration-200`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition duration-200"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">Don't have an account?</p>
            <button
              onClick={() => navigate('/signup')}
              className="mt-2 bg-green-500 text-white py-2 px-8 rounded-lg font-semibold hover:bg-green-600 transition duration-200"
            >
              Create Account
            </button>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default LoginPage;