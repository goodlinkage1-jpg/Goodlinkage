import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import MapDrawing from '../components/realestate/MapDrawing';

const RealEstateDashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('listings'); // listings, add, map
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'RWF',
    category: 'residential',
    address: '',
    city: '',
    country: '',
    areaSize: '',
    areaSizeUnit: 'sqm'
  });
  const [kmlFile, setKmlFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [boundaryInputMethod, setBoundaryInputMethod] = useState('kml'); // 'kml' or 'draw'
  const [drawnGeometry, setDrawnGeometry] = useState(null);

  // Debug effect to log auth state
  useEffect(() => {
    console.log('🔍 RealEstateDashboard Auth State:', {
      currentUser,
      authLoading,
      userId: currentUser?._id
    });
  }, [currentUser, authLoading]);

  // Use dynamic API URL to match AuthContext
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
    }
    return 'https://goodlinkage-api.vercel.app';
  };

  const API_URL = getApiUrl();

  // Fetch user's listings
  useEffect(() => {
    console.log('📌 useEffect triggered:', { activeTab, authLoading, hasCurrentUser: !!currentUser, userId: currentUser?._id });
    if (activeTab === 'listings' && !authLoading && currentUser && currentUser._id) {
      console.log('✅ Conditions met, calling fetchListings');
      fetchListings();
    } else {
      console.warn('⚠️ Conditions not met:', {
        isListingsTab: activeTab === 'listings',
        notLoading: !authLoading,
        hasUser: !!currentUser,
        hasUserId: !!currentUser?._id
      });
    }
  }, [activeTab, currentUser, authLoading]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      if (!currentUser || !currentUser._id) {
        console.warn('⚠️ currentUser not loaded:', currentUser);
        console.warn('⚠️ authLoading:', authLoading);
        setError('User not loaded. Please refresh the page.');
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ No access token found');
        setError('Authentication token not found. Please login again.');
        return;
      }

      console.log('✅ Fetching listings for seller:', currentUser._id);
      console.log('📍 Using API URL:', API_URL);
      console.log('🔑 Token available:', token.substring(0, 20) + '...');
      
      const url = `${API_URL}/api/listings/seller/${currentUser._id}`;
      console.log('📤 Request URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Listings response:', response.data);
      console.log('📊 Response status:', response.status);
      
      if (response.data.success) {
        console.log('✅ Success! Got', response.data.data?.length || 0, 'listings');
        setListings(response.data.data || []);
      } else {
        console.warn('⚠️ API returned success=false');
        setError(response.data.message || 'Failed to load your listings');
      }
    } catch (err) {
      console.error('❌ Error fetching listings:', err);
      console.error('   - Error message:', err.message);
      if (err.response) {
        console.error('   - Response status:', err.response.status);
        console.error('   - Response data:', err.response.data);
      }
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load your listings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKmlChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.kml', '.kmz'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Only KML and KMZ files are supported');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      setKmlFile(file);
      setError('');
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (photoFiles.length + files.length > 10) {
      setError('Maximum 10 photos allowed');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    let processedCount = 0;
    const newPhotos = [];
    const newPreviews = [];
    
    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Each photo must be less than 10MB');
        return;
      }
      
      // Convert file to base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result will be a base64 data URL like: data:image/png;base64,iVBORw0KGg...
        newPhotos.push(reader.result);
        newPreviews.push(reader.result);
        processedCount++;
        
        // Update state once all files are processed
        if (processedCount === files.length) {
          setPhotoFiles(prev => [...prev, ...newPhotos]);
          setPreviewUrls(prev => [...prev, ...newPreviews]);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const hasGeometry = boundaryInputMethod === 'kml' ? kmlFile : drawnGeometry;
    if (!formData.title || !formData.description || !formData.price || !formData.address || !hasGeometry) {
      const method = boundaryInputMethod === 'kml' ? 'KML file' : 'drawing on the map';
      setError(`Please fill in all required fields and upload a ${method}`);
      return;
    }
    
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('areaSize', parseFloat(formData.areaSize) || 0);
      formDataToSend.append('areaSizeUnit', formData.areaSizeUnit);
      
      // Add boundary data (either KML file or drawn geometry)
      if (boundaryInputMethod === 'kml' && kmlFile) {
        formDataToSend.append('kmlFile', kmlFile);
      } else if (boundaryInputMethod === 'draw' && drawnGeometry) {
        // Send geometry as JSON
        formDataToSend.append('geometry', JSON.stringify(drawnGeometry));
      }
      
      // Add photos as base64 strings (already converted in handlePhotoChange)
      // Send as array in FormData
      photoFiles.forEach((photoBase64, index) => {
        formDataToSend.append(`photos`, photoBase64);
      });
      
      const response = await axios.post(`${API_URL}/api/listings`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      if (response.data.success) {
        setSuccess('Land listing created successfully!');
        resetForm();
        setActiveTab('listings');
        fetchListings();
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      currency: 'RWF',
      category: 'residential',
      address: '',
      city: '',
      country: '',
      areaSize: '',
      areaSizeUnit: 'sqm'
    });
    setKmlFile(null);
    setPhotoFiles([]);
    setPreviewUrls([]);
    setDrawnGeometry(null);
    setBoundaryInputMethod('kml');
    setError('');
    setSuccess('');
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/api/listings/${listingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Listing deleted successfully');
        fetchListings();
      }
    } catch (err) {
      setError('Failed to delete listing');
    }
  };

  const handleToggleListingStatus = async (listingId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
      const response = await axios.put(`${API_URL}/api/listings/${listingId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess(`Property marked as ${newStatus.toUpperCase()}`);
        fetchListings();
      }
    } catch (err) {
      console.error('Error updating listing status:', err);
      setError('Failed to update property status');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Land & Real Estate Management</h1>
          <p className="text-green-100 text-lg">Manage your property listings and view them on interactive maps</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'listings'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 My Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ➕ Add New Property
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'map'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗺️ View on Map
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Diagnostic Info Panel */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <details className="cursor-pointer">
            <summary className="font-semibold text-blue-900 hover:text-blue-700">
              🔧 Diagnostic Info (Click to expand)
            </summary>
            <div className="mt-3 space-y-2 text-blue-900 font-mono text-xs">
              <p>📍 API URL: <code className="bg-white px-2 py-1 rounded">{API_URL}</code></p>
              <p>👤 User ID: <code className="bg-white px-2 py-1 rounded">{currentUser?._id || 'Not logged in'}</code></p>
              <p>📧 Email: <code className="bg-white px-2 py-1 rounded">{currentUser?.email || 'N/A'}</code></p>
              <p>🔑 Token: <code className="bg-white px-2 py-1 rounded">{localStorage.getItem('accessToken')?.substring(0, 20)}...</code></p>
              <p>⏳ Auth Loading: {authLoading ? '✅ Loading' : '❌ Not loading'}</p>
              <button
                onClick={async () => {
                  if (currentUser) {
                    const url = `${API_URL}/api/listings/seller/${currentUser._id}`;
                    console.log('🧪 Testing API endpoint:', url);
                    try {
                      const res = await axios.get(url, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                      });
                      console.log('✅ Test result:', res.data);
                      alert(`Test successful! Got ${res.data.count} listings`);
                    } catch (err) {
                      console.error('❌ Test failed:', err);
                      alert(`Test failed: ${err.message}`);
                    }
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
              >
                Test API Endpoint
              </button>
            </div>
          </details>
        </div>

        {/* My Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Land Listings</h2>
            {authLoading ? (
              <p className="text-center py-8 text-gray-600">🔄 Loading your account...</p>
            ) : !currentUser ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">Please log in to view your listings</p>
              </div>
            ) : loading ? (
              <p className="text-center py-8">Loading listings...</p>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No listings yet</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600">
                    <p className="text-gray-600 text-sm">Total Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{listings.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-600">
                    <p className="text-gray-600 text-sm">Available</p>
                    <p className="text-3xl font-bold text-green-600">{listings.filter(l => l.status === 'active').length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600">
                    <p className="text-gray-600 text-sm">Sold</p>
                    <p className="text-3xl font-bold text-red-600">{listings.filter(l => l.status === 'sold').length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <div key={listing._id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group ${listing.status === 'sold' ? 'opacity-75' : ''}`}>
                    {/* Photo Section */}
                    <div className="relative w-full h-48 bg-gradient-to-r from-green-500 to-emerald-500 overflow-hidden">
                      {listing.photos && listing.photos.length > 0 ? (
                        <>
                          <img
                            src={listing.photos[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <span className="text-white text-4xl">🏠</span>
                          </div>
                          {/* Photo count badge */}
                          {listing.photos.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                              📸 {listing.photos.length} photos
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-4xl">🏠</span>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        {listing.status === 'sold' ? (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">SOLD</span>
                        ) : (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">AVAILABLE</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-2">{listing.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      <div className="mb-3 space-y-2">
                        <p className="text-sm"><span className="font-semibold">Price:</span> {listing.price} {listing.currency}</p>
                        <p className="text-sm"><span className="font-semibold">Location:</span> {listing.address}</p>
                        <p className="text-sm"><span className="font-semibold">Category:</span> {listing.category}</p>
                        {listing.areaSize && (
                          <p className="text-sm"><span className="font-semibold">Area:</span> {listing.areaSize} {listing.areaSizeUnit}</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleDeleteListing(listing._id)}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleToggleListingStatus(listing._id, listing.status)}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                            listing.status === 'sold'
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {listing.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
        )}

        {/* Add New Property Tab */}
        {activeTab === 'add' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Add New Land/Property</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
              
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g., Residential Plot in Kigali"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Describe the property, its features, and surroundings..."
                      rows="4"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleFormChange}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="RWF">RWF (Rwanda)</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="agricultural">Agricultural</option>
                      <option value="industrial">Industrial</option>
                      <option value="mixed">Mixed Use</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Location Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="Street address"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleFormChange}
                        placeholder="e.g., Kigali"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleFormChange}
                        placeholder="e.g., Rwanda"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Area Size</label>
                      <input
                        type="number"
                        name="areaSize"
                        value={formData.areaSize}
                        onChange={handleFormChange}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        name="areaSizeUnit"
                        value={formData.areaSizeUnit}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="sqm">Square Meters</option>
                        <option value="sqft">Square Feet</option>
                        <option value="ha">Hectares</option>
                        <option value="acres">Acres</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Boundary Input - Toggle Between KML and Drawing */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Property Boundary *</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBoundaryInputMethod('kml');
                        setDrawnGeometry(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        boundaryInputMethod === 'kml'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📁 Upload KML
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBoundaryInputMethod('draw');
                        setKmlFile(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        boundaryInputMethod === 'draw'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🎨 Draw on Map
                    </button>
                  </div>
                </div>

                {/* KML File Upload Section */}
                {boundaryInputMethod === 'kml' && (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-600 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".kml,.kmz"
                      onChange={handleKmlChange}
                      className="hidden"
                      id="kml-input"
                    />
                    <label htmlFor="kml-input" className="cursor-pointer">
                      <div className="text-4xl mb-2">📍</div>
                      <p className="text-gray-700 font-medium">Click to upload or drag KML/KMZ file</p>
                      <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
                      {kmlFile && (
                        <p className="text-green-600 mt-3 font-medium">✓ {kmlFile.name}</p>
                      )}
                    </label>
                  </div>
                )}

                {/* Map Drawing Section */}
                {boundaryInputMethod === 'draw' && (
                  <div>
                    <MapDrawing
                      onGeometryChange={setDrawnGeometry}
                      onDrawingStart={() => setError('')}
                      initialGeometry={drawnGeometry}
                    />
                    {drawnGeometry && (
                      <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-green-800 font-medium">✓ Boundary drawn successfully</p>
                        <p className="text-sm text-green-700 mt-1">
                          Geometry type: <code className="bg-white px-2 py-1 rounded">{drawnGeometry.type}</code>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Property Photos</h3>
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-600 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-input"
                  />
                  <label htmlFor="photo-input" className="cursor-pointer">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-700 font-medium">Click to upload photos</p>
                    <p className="text-sm text-gray-500 mt-2">Maximum 10 photos, 10MB each</p>
                  </label>
                </div>

                {/* Photo Previews */}
                {previewUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Selected Photos ({previewUrls.length})</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating Listing...' : 'Create Land Listing'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View on Map Tab */}
        {activeTab === 'map' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">View Properties on Map</h2>
            <p className="text-gray-600 mb-4">Open the map view to see all your properties with their boundaries displayed on the satellite map.</p>
            <div className="bg-white p-6 rounded-lg shadow-md text-center py-12">
              <p className="text-lg text-gray-600 mb-6">🗺️ Map View Coming Soon</p>
              <a
                href="/properties-map"
                className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                View Full Map
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RealEstateDashboard;
