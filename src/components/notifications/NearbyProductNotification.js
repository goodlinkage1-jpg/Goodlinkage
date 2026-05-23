// src/components/notifications/NearbyProductNotification.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import locationNotificationService from '../../services/LocationNotificationService';

const NearbyProductNotification = ({ products, enabled = true, threshold = 1000 }) => {
  const [notifications, setNotifications] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const serviceInitialized = useRef(false);
  const navigate = useNavigate();

  // Initialize location service with products
  useEffect(() => {
    console.log("NearbyProductNotification - Products received:", products?.length || 0);
    
    // Only initialize if we have products
    if (products && products.length > 0) {
      console.log("Initializing location notification service with products");
      
      // Initialize service with products
      locationNotificationService.initialize(products, {
        proximityThreshold: threshold,
        onNotification: handleNotification
      });
      
      serviceInitialized.current = true;
      
      // Check notification and geolocation permissions
      checkPermissions();
    }
    
    return () => {
      // Cleanup on unmount
      if (serviceInitialized.current) {
        console.log("Cleaning up location service");
        locationNotificationService.stopTracking();
        setIsTracking(false);
      }
    };
  }, [products]);

  // Start/stop tracking based on enabled prop and threshold changes
  useEffect(() => {
    if (!serviceInitialized.current) return;
    
    console.log("Location tracking enabled:", enabled, "threshold:", threshold);
    
    if (enabled && products && products.length > 0) {
      // Update threshold
      locationNotificationService.setProximityThreshold(threshold);
      
      // Start tracking if not already tracking
      if (!isTracking) {
        console.log("Starting location tracking");
        startTracking();
      }
    } else if (!enabled && isTracking) {
      console.log("Stopping location tracking");
      stopTracking();
    }
  }, [enabled, threshold, isTracking, products]);

  // Check permissions for geolocation and notifications
  const checkPermissions = async () => {
    // Check notification permission
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
    
    // If everything looks good and we're supposed to be enabled, start tracking
    if (enabled && serviceInitialized.current && products && products.length > 0) {
      startTracking();
    }
  };

  const startTracking = async () => {
    console.log("Starting location tracking service");
    const success = await locationNotificationService.startTracking();
    console.log("Location tracking started:", success);
    setIsTracking(success);
    
    if (!success) {
      // If we failed to start tracking, show a notification to the user
      console.warn("Failed to start location tracking");
    }
  };

  const stopTracking = () => {
    console.log("Stopping location tracking service");
    locationNotificationService.stopTracking();
    setIsTracking(false);
  };

  const handleNotification = (product, distance) => {
    console.log("Notification received for product:", product.title || product.productname);
    
    // Use proper product ID
    const productId = product.id || product._id;
    
    // Add new notification to the top of the list
    setNotifications(prev => [{
      id: `${productId}-${Date.now()}`,
      product,
      distance,
      timestamp: new Date()
    }, ...prev.slice(0, 19)]); // Limit to 20 notifications max
  };

  const handleProductClick = (productId) => {
    // Navigate to product detail page
    navigate(`/product/${productId}`);//Change For Feture
  };

  const dismissNotification = (notificationId, e) => {
    e.stopPropagation(); // Prevent click from bubbling to parent
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  // Request notification permissions
  const requestPermissions = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === "granted") {
        startTracking();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Format distance to be more readable
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} meters`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Format time elapsed 
  const formatTimeElapsed = (timestamp) => {
    const now = new Date();
    const elapsed = Math.floor((now - timestamp) / 1000); // seconds
    
    if (elapsed < 60) {
      return 'Just now';
    } else if (elapsed < 3600) {
      return `${Math.floor(elapsed / 60)} min ago`;
    } else {
      return `${Math.floor(elapsed / 3600)} hr ago`;
    }
  };

  // If permissions not granted, show permission request
  if (permissionStatus === "denied") {
    return (
      <div className="fixed bottom-0 right-0 m-4 max-w-sm z-50">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
            <span className="font-medium">Location notifications disabled</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Please enable notifications and location services to receive alerts about nearby products.
          </p>
          <button
            onClick={() => window.open('about:settings', '_blank')}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Browser Settings
          </button>
        </div>
      </div>
    );
  }

  // If permissions not yet granted but not denied, show request button
  if (permissionStatus !== "granted" && !isTracking) {
    return (
      <div className="fixed bottom-0 right-0 m-4 max-w-sm z-50">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500"></div>
            <span className="font-medium">Nearby Products Feature</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Get notified when you're near products you might be interested in.
          </p>
          <button
            onClick={requestPermissions}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enable Notifications
          </button>
        </div>
      </div>
    );
  }

  // Don't render anything if disabled and no notifications
  if (!enabled && notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 m-4 max-w-sm z-50">
      {/* Status indicator */}
      <div className="flex items-center justify-between bg-white rounded-t-lg border border-gray-200 p-2 shadow-lg">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            {isTracking ? 'Looking for nearby products' : 'Location tracking paused'}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={isTracking ? stopTracking : startTracking}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            {isTracking ? 'Pause' : 'Resume'}
          </button>
          {notifications.length > 0 && (
            <button 
              onClick={dismissAllNotifications}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 max-h-96 overflow-y-auto shadow-lg">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
              onClick={() => handleProductClick(notification.product.id || notification.product._id)}
            >
              <div className="flex justify-between">
                <div className="flex-1 mr-3">
                  <div className="flex items-start">
                    <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0 mr-3">
                      <img 
                        src={notification.product.image || 
                          (Array.isArray(notification.product.productimage) && 
                           notification.product.productimage.length > 0 ? 
                           notification.product.productimage[0] : 
                           'https://via.placeholder.com/48')} 
                        alt={notification.product.title || notification.product.productname}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/48';
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {notification.product.title || notification.product.productname}
                      </h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{formatDistance(notification.distance)} away</span>
                      </div>
                      <div className="text-blue-600 font-medium text-sm">
                        {notification.product.price} Rwf
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <button 
                    onClick={(e) => dismissNotification(notification.id, e)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-400 mt-auto">
                    {formatTimeElapsed(notification.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyProductNotification;