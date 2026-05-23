import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthSuccess = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleAuth } = useAuth();
  
  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Get token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          console.error('No authentication token received');
          setError('Authentication failed. No token received.');
          return;
        }
        
        console.log('Received token from Google auth redirect');
        
        // Complete the Google authentication process
        const success = await completeGoogleAuth(token);
        
        if (success) {
          console.log('Google authentication completed successfully');
          // Redirect to home page on success
          navigate('/Homepage');
        } else {
          console.error('Failed to complete Google authentication');
          setError('Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Auth success handler error:', error);
        setError('An error occurred during authentication. Please try again.');
      }
    };
    
    handleAuthSuccess();
  }, [location, navigate, completeGoogleAuth]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        {error ? (
          <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg">Completing authentication...</p>
          <p className="text-gray-500 mt-2">Please wait while we sign you in.</p>
        </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg">Completing authentication...</p>
            <p className="text-gray-500 mt-2">Please wait while we sign you in.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;