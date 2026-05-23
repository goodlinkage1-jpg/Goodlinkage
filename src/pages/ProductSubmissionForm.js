import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../Config';

const ProductSubmissionForm = ({ onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    description: '',
    image: null,
    imagePreview: null,
    location: {
      lat: -1.9441, // Default to Kigali, Rwanda coordinates
      lng: 30.0619,
      address: 'Kigali, Rwanda'
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  // Load Google Maps API
  useEffect(() => {
    if (showForm && !mapLoaded) {
      const googleMapScript = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;
      if (!apiKey) {
        console.error('❌ Google Maps API key not found in environment variables');
        return;
      }
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      
      googleMapScript.onload = () => {
        console.log('✅ Google Maps API loaded successfully');
        setMapLoaded(true);
      };
      
      googleMapScript.onerror = () => {
        console.error('❌ Failed to load Google Maps API. Please check your API key.');
      };
      
      window.document.body.appendChild(googleMapScript);
      
      return () => {
        try {
          window.document.body.removeChild(googleMapScript);
        } catch (e) {
          // Script might have already been removed
        }
      };
    }
  }, [showForm, mapLoaded]);
  
  // Initialize map once API is loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current) {
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: formData.location.lat, lng: formData.location.lng },
        zoom: 12,
        mapTypeControl: false,
      });
      googleMapRef.current = map;
      
      // Initialize geocoder
      geocoderRef.current = new window.google.maps.Geocoder();
      
      // Add marker to initial position
      const marker = new window.google.maps.Marker({
        position: { lat: formData.location.lat, lng: formData.location.lng },
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = marker;
      
      // Update location when marker is dragged
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        updateLocationFromLatLng(position.lat(), position.lng());
      });
      
      // Update location when map is clicked
      map.addListener('click', (event) => {
        marker.setPosition(event.latLng);
        updateLocationFromLatLng(event.latLng.lat(), event.latLng.lng());
      });
      
      // Initialize the location address
      updateLocationFromLatLng(formData.location.lat, formData.location.lng);
      
      // Add search box
      const input = document.getElementById('location-search');
      const searchBox = new window.google.maps.places.SearchBox(input);
      
      // Bias the SearchBox results towards current map's viewport
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds());
      });
      
      // Listen for the event fired when the user selects a prediction
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;
        
        // Update the map and marker
        map.setCenter(place.geometry.location);
        marker.setPosition(place.geometry.location);
        
        // Update the form data with the new location
        updateLocationFromLatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
          place.formatted_address
        );
      });
    }
  }, [mapLoaded, formData.location.lat, formData.location.lng]);
  
  // Function to update location in the form data
  const updateLocationFromLatLng = (lat, lng, address = null) => {
    if (address) {
      setFormData(prev => ({
        ...prev,
        location: { lat, lng, address }
      }));
    } else if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              address: results[0].formatted_address
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            location: { lat, lng, address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` }
          }));
        }
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Convert image to base64 string
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result // This will be a base64 string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Product name is required';
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image) newErrors.image = 'Please upload an image';
    if (!formData.location.address) newErrors.location = 'Please select a location';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('You must be logged in to create a product');
      }
      
      // Create product data to send to the API
      const productData = {
        productname: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        productimage: formData.imagePreview, // Base64 encoded image
        location: {
          latitude: formData.location.lat,
          longitude: formData.location.lng,
          address: formData.location.address
        }
      };
      
      // Send request to API
      const response = await axios.post(`${API_URL}/product/create`, productData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      // Handle success
      if (response.data.success) {
        // Call the onSubmit function passed from parent component
        onSubmit(response.data.data);
        
        // Show success message
        setSubmitMessage({
          type: 'success',
          text: 'Product created successfully!'
        });
        
        // Reset form
        setFormData({
          title: '',
          price: '',
          category: '',
          description: '',
          image: null,
          imagePreview: null,
          location: {
            lat: -1.9441,
            lng: 30.0619,
            address: 'Kigali, Rwanda'
          }
        });
        
        // Hide form after successful submission
        setTimeout(() => {
          setShowForm(false);
          setSubmitMessage(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      
      // Show error message
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create product. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + List Your Product
        </button>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Add New Product</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {submitMessage && (
            <div className={`p-4 mb-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {submitMessage.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                Product Name
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter product name"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="price">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  className={`w-full p-3 border rounded-lg ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`w-full p-3 border rounded-lg ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Describe your product..."
              ></textarea>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Product Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                  {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                </div>
                {formData.imagePreview && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img 
                      src={formData.imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-md" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Location Section */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Product Location
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  id="location-search"
                  placeholder="Search for a location"
                  className={`w-full p-3 border rounded-lg ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                />
                
                <div 
                  ref={mapRef} 
                  className="w-full h-64 rounded-lg border border-gray-300"
                ></div>
                
                {formData.location.address && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Selected Location:</p>
                    <p className="text-sm text-gray-600">{formData.location.address}</p>
                  </div>
                )}
                
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'List Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductSubmissionForm;