import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthSuccess = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleAuth } = useAuth();
  
  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Get token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const errorParam = params.get('error');
        const reason = params.get('reason');
        
        if (errorParam) {
          console.error('❌ Auth error from backend:', errorParam, reason);
          setError(`Authentication failed: ${reason || errorParam}`);
          setIsLoading(false);
          return;
        }
        
        if (!token) {
          console.error('❌ No authentication token received');
          setError('Authentication failed. No token received.');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Received token from Google auth redirect');
        
        // Complete the Google authentication process
        const success = await completeGoogleAuth(token);
        
        if (success) {
          console.log('✅ Google authentication completed successfully');
          // Small delay to ensure state updates before navigation
          setTimeout(() => {
            navigate('/Homepage', { replace: true });
          }, 500);
        } else {
          console.error('❌ Failed to complete Google authentication');
          
          // Retry logic for transient failures
          if (retryCount < MAX_RETRIES) {
            console.log(`⚠️ Retrying authentication (${retryCount + 1}/${MAX_RETRIES})...`);
            setRetryCount(retryCount + 1);
            // Wait before retrying
            setTimeout(() => {
              handleAuthSuccess();
            }, 1000 * (retryCount + 1)); // Exponential backoff
          } else {
            setError('Authentication failed. Please try logging in again.');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth success handler error:', error);
        
        // Retry on transient errors
        if (retryCount < MAX_RETRIES && error.message.includes('Network')) {
          console.log(`⚠️ Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(retryCount + 1);
          setTimeout(() => {
            handleAuthSuccess();
          }, 1000 * (retryCount + 1));
        } else {
          setError('An error occurred during authentication. Please try again.');
          setIsLoading(false);
        }
      }
    };
    
    handleAuthSuccess();
  }, [location, navigate, completeGoogleAuth, retryCount]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        {isLoading && !error ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 mb-2">Completing authentication...</p>
            {retryCount > 0 && <p className="text-sm text-gray-500">Attempt {retryCount + 1} of {MAX_RETRIES + 1}</p>}
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 text-3xl mb-3">✕</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-500 text-3xl mb-3">✓</div>
            <h2 className="text-xl font-semibold text-gray-800">Success!</h2>
            <p className="text-gray-600">Redirecting to homepage...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
       