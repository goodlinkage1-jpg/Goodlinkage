// src/services/LocationNotificationService.js

class LocationNotificationService {
  constructor() {
    this.watchId = null;
    this.products = [];
    this.notifiedProductIds = new Set(); // Track already notified products
    this.proximityThreshold = 1000; // Default 1000 meters (1km)
    this.isRunning = false;
    this.onNotificationCallback = null;
    this.userLocation = null;
    this.lastCheck = 0;
    this.checkInterval = 10000; // Check every 10 seconds, not on every tiny movement
  }

  // Initialize the service with products data
  initialize(products, options = {}) {
    console.log("Initializing location service with", products.length, "products");
    
    // Filter products with valid location data - handle both data structures
    this.products = products.filter(product => {
      // Check if location exists in the expected format
      const hasValidLocation = product.location && 
        (
          // Check for both possible data structures
          (typeof product.location.latitude !== 'undefined' && typeof product.location.longitude !== 'undefined') ||
          (typeof product.location.lat !== 'undefined' && typeof product.location.lng !== 'undefined')
        );
      
      if (!hasValidLocation) {
        console.log("Skipping product without valid location:", product.title || product.productname);
      }
      return hasValidLocation;
    });
    
    console.log("Found", this.products.length, "products with valid location data");
    
    // Override default options
    if (options.proximityThreshold) {
      this.proximityThreshold = options.proximityThreshold;
    }
    
    if (options.onNotification && typeof options.onNotification === 'function') {
      this.onNotificationCallback = options.onNotification;
    }
    
    return this;
  }

  // Set notification callback function
  setNotificationCallback(callback) {
    if (typeof callback === 'function') {
      this.onNotificationCallback = callback;
    }
    return this;
  }

  // Set proximity threshold in meters
  setProximityThreshold(meters) {
    this.proximityThreshold = meters;
    // If we're already running, check for nearby products with the new threshold
    if (this.isRunning && this.userLocation) {
      this.checkNearbyProducts(this.userLocation);
    }
    return this;
  }

  // Start tracking user location
  async startTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return false;
    }

    if (this.isRunning) {
      return true; // Already running
    }

    try {
      // Request permission for notifications first
      const notificationPermission = await this.requestNotificationPermission();
      if (!notificationPermission) {
        console.warn("Notification permission denied. User won't receive browser notifications.");
      }
      
      // Get user's current position first (one-time)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got initial position:", position.coords.latitude, position.coords.longitude);
          this.handlePositionUpdate(position);
          
          // Then start watching position for changes
          this.watchId = navigator.geolocation.watchPosition(
            this.handlePositionUpdate.bind(this),
            this.handleError.bind(this),
            {
              enableHighAccuracy: true,
              maximumAge: 30000, // 30 seconds
              timeout: 27000 // 27 seconds
            }
          );
          
          this.isRunning = true;
          console.log('Location tracking started successfully');
        },
        this.handleError.bind(this),
        {
          enableHighAccuracy: true,
          timeout: 10000 // 10 seconds
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isRunning = false;
      console.log('Location tracking stopped');
    }
    return this;
  }

  // Reset notification history (will allow re-notification for the same products)
  resetNotificationHistory() {
    this.notifiedProductIds.clear();
    return this;
  }

  // Handle position updates
  handlePositionUpdate(position) {
    const now = Date.now();
    this.userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    // Throttle checks to reduce unnecessary calculations
    if (now - this.lastCheck > this.checkInterval) {
      this.lastCheck = now;
      this.checkNearbyProducts(this.userLocation);
    }
  }
  
  // Check for nearby products based on user location
  checkNearbyProducts(userLocation) {
    console.log("Checking for nearby products...");
    console.log("User location:", userLocation);
    console.log("Proximity threshold:", this.proximityThreshold, "meters");
    
    if (this.products.length === 0) {
      console.log("No products with location data to check");
      return;
    }
    
    // Check each product
    this.products.forEach(product => {
      // Skip if already notified for this product
      if (this.notifiedProductIds.has(product.id || product._id)) {
        return;
      }
      
      // Get product location, handling both possible data structures
      const productLat = product.location.latitude || product.location.lat;
      const productLng = product.location.longitude || product.location.lng;
      
      const distance = this.calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        productLat,
        productLng
      );
      
      console.log(`Product "${product.title || product.productname}" is ${distance.toFixed(0)} meters away`);
      
      // If user is within the proximity threshold
      if (distance <= this.proximityThreshold) {
        console.log(`Product "${product.title || product.productname}" is nearby! Sending notification.`);
        this.notifyUser(product, distance);
        this.notifiedProductIds.add(product.id || product._id);
      }
    });
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
      }
    }

    return false;
  }

  // Notify user about nearby product
  notifyUser(product, distance) {
    // Use proper product properties based on API structure
    const productId = product.id || product._id;
    const productTitle = product.title || product.productname;
    const productPrice = product.price || 0;
    const productImage = product.image || 
      (Array.isArray(product.productimage) && product.productimage.length > 0 
        ? product.productimage[0] 
        : '/logo.png');
    
    // Trigger callback if provided
    if (this.onNotificationCallback) {
      this.onNotificationCallback(product, distance);
    }

    // Browser notification
    if (Notification.permission === "granted") {
      const distanceKm = (distance / 1000).toFixed(1);
      
      try {
        const notification = new Notification("Nearby Product Alert!", {
          body: `${productTitle} is just ${distanceKm}km away from you!\nPrice: ${productPrice} Rwf`,
          icon: productImage, // Fallback to your app logo
        });

        notification.onclick = () => {
          window.focus();
          // Redirect to product page
          if (productId) {
            window.location.href = `/product/${productId}`;
          }
          notification.close();
        };
      } catch (error) {
        console.error("Error creating notification:", error);
      }
    }
  }

  // Handle errors
  handleError(error) {
    console.error('Geolocation error:', error);
    switch(error.code) {
      case error.PERMISSION_DENIED:
        console.error("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        console.error("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        console.error("The request to get user location timed out.");
        break;
      default:
        console.error("An unknown error occurred.");
        break;
    }
  }
}

// Create and export a singleton instance
const locationNotificationService = new LocationNotificationService();
export default locationNotificationService;