import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

// Create a context for admin authentication
const AdminAuthContext = createContext();

const API_URL = 'https://goodlinkage-api.vercel.app/api';

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
}; 

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Setup axios interceptors for token handling
  useEffect(() => {
    // Add request interceptor to include token in all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminAccessToken');
        if (token && config.url.includes('/api/admin')) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry && 
            originalRequest.url !== `${API_URL}/admin/refresh-token` && 
            originalRequest.url !== `${API_URL}/admin/login`) {
          
          originalRequest._retry = true;
          
          try {
            // Get refresh token from localStorage
            const refreshToken = localStorage.getItem('adminRefreshToken');
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            // Call refresh token endpoint with credentials
            console.log('🔄 Attempting token refresh...');
            const response = await axios.post(`${API_URL}/admin/refresh-token`, {}, {
              withCredentials: true // Include cookies if using httpOnly cookies
            });
            
            if (response.data.success) {
              // Update access token
              const newAccessToken = response.data.data.accessToken;
              localStorage.setItem('adminAccessToken', newAccessToken);
              
              // Update authorization header
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              
              console.log('✅ Token refreshed successfully');
              
              // Retry the original request
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // If refresh token fails, log the user out (only if on admin routes)
            if (location.pathname.startsWith('/admin')) {
              logoutAdmin();
            }
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [location.pathname]);

  // Check admin auth on mount and when accessing admin routes
  useEffect(() => {
    const checkAdminAuth = async () => {
      // If not on admin route, just set loading to false and return
      if (!location.pathname.startsWith('/admin')) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const token = localStorage.getItem('adminAccessToken');
        const adminInfo = localStorage.getItem('adminInfo');
        const refreshToken = localStorage.getItem('adminRefreshToken');
        
        if (!token || !adminInfo || !refreshToken) {
          console.log('❌ Missing tokens or admin info');
          setIsAdminAuthenticated(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }
        
        // Validate the token by calling the profile API
        console.log('🔐 Validating access token...');
        const response = await axios.get(`${API_URL}/admin/profile`);
        
        if (response.data.success) {
          setAdminUser(response.data.data);
          setIsAdminAuthenticated(true);
          console.log('✅ Admin authenticated successfully');
        } else {
          // If validation fails, clear local storage
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminInfo');
          setIsAdminAuthenticated(false);
          setAdminUser(null);
        }
      } catch (error) {
        console.error('❌ Admin auth check failed:', error);
        // Only clear tokens if it's a 401 error and refresh failed
        if (error.response?.status === 401) {
          // The interceptor will handle token refresh automatically
          // If we reach here, it means refresh failed
          console.log('🔄 Auth check failed, tokens may be invalid');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAuth();
  }, [location.pathname]);

  // Login function
  const loginAdmin = async (email, password) => {
    try {
      console.log('🔐 Attempting admin login...');
      const response = await axios.post(`${API_URL}/admin/login`, {
        email,
        password
      }, {
        withCredentials: true // Include cookies
      });
      
      if (response.data.success) {
        // Store tokens and admin info
        localStorage.setItem('adminAccessToken', response.data.data.accessToken);
        localStorage.setItem('adminRefreshToken', response.data.data.refreshToken);
        localStorage.setItem('adminInfo', JSON.stringify(response.data.data.admin));
        
        setAdminUser(response.data.data.admin);
        setIsAdminAuthenticated(true);
        
        console.log('✅ Admin login successful');
        
        // Navigate to admin dashboard after successful login
        navigate('/admin/dashboard');
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logoutAdmin = async () => {
    try {
      // Get refresh token for logout API call
      const refreshToken = localStorage.getItem('adminRefreshToken');
      
      // Try to call logout API
      await axios.post(`${API_URL}/admin/logout`, {
        refreshToken
      }, {
        withCredentials: true
      });
      
      console.log('📤 Logout API called successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all stored data
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminInfo');
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      
      console.log('🚪 Admin logged out');
      navigate('/');
    }
  };

  const value = {
    adminUser,
    loading,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children || <Outlet />}
    </AdminAuthContext.Provider>
  );
};