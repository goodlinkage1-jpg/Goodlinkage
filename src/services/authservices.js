import axios from 'axios';

// API base URL - update this to your actual backend URL
const API_URL = 'https://goodlinkage-api.vercel.app/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('refreshToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response.status === 401 && 
        error.response.data.expired === true && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token available, logout
          authService.logout();
          return Promise.reject(error);
        }
        
        // Call the refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true // Important to include cookies
        });
        
        if (response.data.success) {
          // Store the new access token
          localStorage.setItem('accessToken', response.data.data.accessToken);
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // Refresh failed, logout
          authService.logout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token request failed, logout
        authService.logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  // Login a user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  // Logout the current user
  logout: async () => {
    try {
      // Call logout endpoint if user is logged in
      if (localStorage.getItem('accessToken')) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/';
    }
  },
  
  // Get the current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
  
  // Get user profile
  getUserProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  // Get the API instance with auth interceptors
  api
};

export default authService;