import axios from 'axios';

// Dynamic API URL based on environment
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side detection
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:5000/api';
    }
  }
  // Production URL
  return 'https://goodlinkage-api.vercel.app/api';
};

const API_URL = getApiUrl();

const Axiosinstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for refresh token
});

// Add auth token to requests
Axiosinstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentAccessToken');
  if (token && config.url.includes('/agent')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
Axiosinstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && 
        originalRequest.url !== '/agent/refresh-token' && 
        originalRequest.url !== '/agent/login') {
      
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Attempting token refresh via Axiosinstance...');
        
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('agentRefreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token endpoint with both cookie and body approach
        const response = await axios.post(`${API_URL}/agent/refresh-token`, {
          refreshToken: refreshToken // Send in body for localStorage compatibility
        }, {
          withCredentials: true // Also include cookies if available
        });
        
        if (response.data.success) {
          // Update both tokens
          const newAccessToken = response.data.data.accessToken;
          const newRefreshToken = response.data.data.refreshToken;
          
          localStorage.setItem('agentAccessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('agentRefreshToken', newRefreshToken);
          }
          
          // Update authorization header for the retry
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          console.log('✅ Token refreshed successfully via Axiosinstance');
          
          // Retry the original request
          return Axiosinstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed via Axiosinstance:', refreshError);
        
        // If refresh token fails, clear tokens and redirect
        localStorage.removeItem('agentAccessToken');
        localStorage.removeItem('agentRefreshToken');
        localStorage.removeItem('agentInfo');
        
        // Check for AGENT routes
        if (window.location.pathname.startsWith('/agent')) {
          window.location.href = '/agent/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

console.log('🌐 Using API URL:', API_URL);

export default Axiosinstance;