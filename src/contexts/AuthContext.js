import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// API base URL - dynamic based on environment
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side detection
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  // Production URL
  return 'https://goodlinkage-api.vercel.app/api';
};

const API_URL = 'https://goodlinkage-api.vercel.app/api';

console.log('🌐 AuthContext using API_URL:', API_URL);

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Keep this, but remove the Access-Control-Allow-Origin header
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add axios interceptor for adding tokens to requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for token refresh
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is due to expired token and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            console.log('Access token expired, attempting to refresh...');
            // Try to refresh the token - refreshToken will be sent automatically as HTTP-only cookie
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
              withCredentials: true // Important to include cookies
            });
            
            if (response.data.success) {
              console.log('Token refreshed successfully');
              // Store the new access token
              const newAccessToken = response.data.data.accessToken;
              localStorage.setItem('accessToken', newAccessToken);
              
              // Update the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              
              // Retry the original request
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Refresh token failed:', refreshError);
            // Only log out if specifically told the token is invalid
            // Otherwise, network errors shouldn't log the user out
            if (refreshError.response?.status === 401) {
              console.log('Refresh token invalid, logging out');
              await logout(false); // Silent logout
            }
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);
  
  // Try to refresh token and restore session on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        
        // First check if we have an access token
        const accessToken = localStorage.getItem('accessToken');
        
        if (accessToken) {
          console.log('Found existing access token, validating...');
          try {
            // Try to get user profile with current access token
            const response = await api.get(`${API_URL}/auth/profile`);
            if (response.data.success) {
              console.log('Access token is valid, session restored');
              setCurrentUser(response.data.data);
              setLoading(false);
              return; // Session restored successfully
            }
          } catch (error) {
            console.log('Access token invalid, will try refresh token');
            // Access token didn't work, we'll try refresh token next
          }
        }
        
        // Access token didn't work, try to use refresh token (from cookie)
        console.log('Attempting to refresh token...');
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
            withCredentials: true // Must have this
          });
          
          if (response.data.success) {
            console.log('Refresh successful, session restored');
            // Store the new access token
            localStorage.setItem('accessToken', response.data.data.accessToken);
            
            // Now get the user profile with the new token
            const profileResponse = await api.get(`${API_URL}/auth/profile`);
            if (profileResponse.data.success) {
              setCurrentUser(profileResponse.data.data);
            }
          } else {
            // Refresh token didn't work
            console.log('Refresh token failed, need to login again');
            await logout(false); // Silent logout
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
          // Only clear if we get a 401 (unauthorized)
          if (error.response?.status === 401) {
            await logout(false); // Silent logout
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    restoreSession();
  }, []);
  
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        const { accessToken } = response.data.data;
        const user = response.data.data.user;
        
        // Store access token and user data
        localStorage.setItem('accessToken', accessToken);
        
        setCurrentUser(user);
        return user;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password }, {
        withCredentials: true // Important for receiving refresh token cookie
      });
      
      if (response.data.success) {
        const { accessToken } = response.data.data;
        const user = response.data.data.user;
        
        // Store access token only - refresh token is in HTTP-only cookie
        localStorage.setItem('accessToken', accessToken);
        
        setCurrentUser(user);
        return user;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const logout = async (callApi = true) => {
    try {
      // Call logout endpoint if we should call API
      if (callApi && localStorage.getItem('accessToken')) {
        await api.post(`${API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      setCurrentUser(null);
    }
  };
  
  const updateProfile = async (userData) => {
    try {
      const response = await api.put(`${API_URL}/auth/profile`, userData);
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        setCurrentUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };
  
  // Login with Google - initiates Google OAuth flow
  const loginWithGoogle = () => {
    console.log('Initiating Google login flow...');
    // Redirect to the Google auth endpoint
    window.location.href = `${API_URL}/auth/google`;
  };
  
  // Handle Google auth callback
  const completeGoogleAuth = async (token) => {
    if (!token) {
      console.error('❌ No token provided for Google auth completion');
      return false;
    }
    
    try {
      console.log('🔄 Completing Google authentication with token');
      
      // Store the access token
      localStorage.setItem('accessToken', token);
      console.log('✅ Token stored in localStorage');
      
      // Fetch user profile with the new token
      const profileResponse = await api.get(`${API_URL}/auth/profile`);
      
      if (profileResponse.data.success) {
        console.log('✅ Google auth successful, user profile fetched');
        console.log('👤 User:', profileResponse.data.data.email);
        setCurrentUser(profileResponse.data.data);
        return true;
      } else {
        console.error('❌ Failed to fetch user profile:', profileResponse.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Google auth completion error:', error.message);
      
      // Check if it's a network error (might be transient)
      if (error.message.includes('Network') || error.code === 'ECONNABORTED') {
        console.warn('⚠️ Network error - this might be transient');
      }
      
      // Still try to navigate if token is stored (user can retry)
      const hasToken = localStorage.getItem('accessToken');
      if (hasToken) {
        console.log('⚠️ Token stored but profile fetch failed, attempting to recover...');
        try {
          // Retry once more after a short delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryResponse = await api.get(`${API_URL}/auth/profile`);
          if (retryResponse.data.success) {
            setCurrentUser(retryResponse.data.data);
            return true;
          }
        } catch (retryError) {
          console.warn('⚠️ Retry also failed:', retryError.message);
        }
      }
      
      return false;
    }
  };
  
  const value = {
    currentUser,
    loading,
    register,
    login,
    loginWithGoogle,      // Add this
    completeGoogleAuth,   // Add this
    logout,
    updateProfile,
    isAuthenticated: !!currentUser,
    api
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};