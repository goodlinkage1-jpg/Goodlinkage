import axios from 'axios';

const Axiosinstance = axios.create({
  baseURL: 'https://goodlinkage-api.vercel.app/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for refresh token
});

// Add auth token to requests
Axiosinstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) {
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
        originalRequest.url !== '/admin/refresh-token' && 
        originalRequest.url !== '/admin/login') {
      
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Attempting token refresh via Axiosinstance...');
        
        // Get refresh token from localStorage (to match your AdminAuthProvider)
        const refreshToken = localStorage.getItem('adminRefreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token endpoint with credentials and refresh token
        const response = await axios.post('https://goodlinkage-api.vercel.app/api/admin/refresh-token', {}, {
          withCredentials: true // Include cookies
        });
        
        if (response.data.success) {
          // Update access token
          const newAccessToken = response.data.data.accessToken;
          localStorage.setItem('adminAccessToken', newAccessToken);
          
          // Update authorization header for the retry
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          console.log('✅ Token refreshed successfully via Axiosinstance');
          
          // Retry the original request
          return Axiosinstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed via Axiosinstance:', refreshError);
        
        // If refresh token fails, clear tokens and redirect
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminInfo');
        
        // Only redirect if we're on an admin route
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default Axiosinstance;