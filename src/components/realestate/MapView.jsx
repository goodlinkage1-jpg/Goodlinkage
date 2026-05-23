import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * MapView.jsx
 * Interactive satellite map for viewing property listings with polygon overlays
 * 
 * Features:
 * - Leaflet.js + satellite basemap (OpenStreetMap + Satellite)
 * - Real-time polygon overlay rendering from API
 * - Bounding box filtering on map pan/zoom
 * - Click on polygon to show listing detail
 * - Detail sidebar with seller contact
 * - Price filter, category filter
 * 
 * Requires:
 * - Leaflet library (add to package.json and HTML)
 * - axios for API calls
 */

// Dynamically import Leaflet at runtime if needed
let L = null;

const MapView = () => {
  // Map state
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geoJsonLayer = useRef(null);
  const markersGroup = useRef(null);

  // Listings state
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);

  // Initialize map and Leaflet
  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = () => {
      if (typeof window !== 'undefined' && !window.L) {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.async = true;
        leafletScript.onload = () => {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
          initializeMap();
        };
        document.head.appendChild(leafletScript);
      } else if (window.L) {
        L = window.L;
        initializeMap();
      }
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      if (map.current) {
        try {
          // Remove event listeners
          map.current.off('moveend');
          
          // Clear any layers
          if (geoJsonLayer.current) {
            try {
              map.current.removeLayer(geoJsonLayer.current);
            } catch (e) {
              // Layer might already be removed
            }
            geoJsonLayer.current = null;
          }
          
          if (markersGroup.current) {
            try {
              markersGroup.current.clearLayers();
              map.current.removeLayer(markersGroup.current);
            } catch (e) {
              // Group might already be removed
            }
            markersGroup.current = null;
          }
          
          // Remove the map instance
          map.current.remove();
          map.current = null;
        } catch (err) {
          console.error('Error during map cleanup:', err);
        }
      }
    };
  }, []);

  // Initialize Leaflet map
  const initializeMap = () => {
    if (map.current) return; // Already initialized

    if (!mapContainer.current) {
      console.error('Map container not found');
      return;
    }

    L = window.L;

    try {
      // Create map centered on default location (Africa)
      map.current = L.map(mapContainer.current).setView([0, 20], 3);

      // Add satellite basemap (OpenStreetMap + Satellite)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri',
          maxZoom: 19
        }
      );

      const osmLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }
      );

      // Add satellite layer by default
      satelliteLayer.addTo(map.current);

      // Add layer control
      L.control.layers(
        {
          'Satellite': satelliteLayer,
          'OpenStreetMap': osmLayer
        },
        {},
        { position: 'topright' }
      ).addTo(map.current);

      // Create marker group for cluster management
      markersGroup.current = L.featureGroup().addTo(map.current);

      // Listen for map movements and fetch listings in current viewport
      map.current.on('moveend', () => {
        fetchListingsInViewport();
      });

      // Initial fetch
      fetchListingsInViewport();
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  // Fetch listings in current map viewport
  const fetchListingsInViewport = async () => {
    if (!map.current) return;

    try {
      setLoading(true);
      const bounds = map.current.getBounds();

      const params = {
        swLng: bounds.getWest(),
        swLat: bounds.getSouth(),
        neLng: bounds.getEast(),
        neLat: bounds.getNorth()
      };

      // Add filters
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/listings`,
        { params }
      );

      // Only update state if component is still mounted (map still exists)
      if (map.current) {
        if (response.data.success) {
          setListings(response.data.data || []);
          renderListingsOnMap(response.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      // Only set error if component is still mounted
      if (map.current) {
        setError('Failed to fetch listings');
      }
    } finally {
      if (map.current) {
        setLoading(false);
      }
    }
  };

  // Create custom marker icon
  const createPropertyIcon = (category) => {
    const iconColors = {
      land: '#10b981',      // Green for land
      house: '#f59e0b',     // Amber for house
      apartment: '#3b82f6', // Blue for apartment
      commercial: '#ef4444' // Red for commercial
    };

    const color = iconColors[category] || '#6366f1';

    return L.divIcon({
      html: `
        <div class="flex items-center justify-center" style="
          width: 32px;
          height: 40px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: 'property-marker'
    });
  };

  // Render GeoJSON features on map
  const renderListingsOnMap = (listingsData) => {
    if (!map.current) return;

    // Clear previous layers safely
    if (geoJsonLayer.current) {
      try {
        if (map.current.hasLayer(geoJsonLayer.current)) {
          map.current.removeLayer(geoJsonLayer.current);
        }
      } catch (err) {
        console.warn('Error removing geoJsonLayer:', err);
      }
      geoJsonLayer.current = null;
    }

    // Clear markers group
    if (markersGroup.current) {
      try {
        markersGroup.current.clearLayers();
      } catch (err) {
        console.warn('Error clearing markersGroup:', err);
      }
    }

    // Create GeoJSON features from listings
    const features = listingsData.map(listing => ({
      type: 'Feature',
      properties: {
        id: listing._id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        category: listing.category,
        address: listing.address,
        photos: listing.photos,
        areaSize: listing.areaSize
      },
      geometry: listing.geometry
    }));

    const geoJsonData = {
      type: 'FeatureCollection',
      features
    };

    // Category colors for polygons
    const getCategoryColor = (category) => {
      const colors = {
        land: '#10b981',
        house: '#f59e0b',
        apartment: '#3b82f6',
        commercial: '#ef4444'
      };
      return colors[category] || '#6366f1';
    };

    // Style and add GeoJSON layer
    geoJsonLayer.current = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const color = getCategoryColor(feature.properties.category);
        return {
          color: color,
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.15,
          fillColor: color
        };
      },
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: createPropertyIcon(feature.properties.category)
        });
      },
      onEachFeature: (feature, layer) => {
        const { title, price, currency, address, category, photos } = feature.properties;

        // Create rich popup with image
        let photoHtml = '';
        if (photos && photos.length > 0) {
          // Escape the URL to prevent issues
          const photoUrl = photos[0].replace(/'/g, "\\'").replace(/"/g, '\\"');
          photoHtml = `
            <div class="mb-2 rounded overflow-hidden" style="width: 250px; height: 150px;">
              <img src="${photoUrl}" alt="Property" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
          `;
        }

        // Escape HTML special characters in text
        const escapeHtml = (text) => {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        };

        const escapedTitle = escapeHtml(title);
        const escapedAddress = escapeHtml(address);
        const escapedCategory = escapeHtml(category.charAt(0).toUpperCase() + category.slice(1));

        const popupContent = `
          <div class="p-3 min-w-sm" style="max-width: 300px;">
            ${photoHtml}
            <h3 class="font-bold text-base text-gray-800">${escapedTitle}</h3>
            <p class="text-gray-600 text-xs mb-2">${escapedAddress}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p class="font-semibold text-lg" style="color: ${getCategoryColor(category)};">
                ${price} ${currency}
              </p>
              <span class="text-xs px-2 py-1 rounded" style="
                background: ${getCategoryColor(category)}; 
                color: white;
              ">
                ${escapedCategory}
              </span>
            </div>
          </div>
        `;

        try {
          layer.bindPopup(popupContent, { maxWidth: 300 });
        } catch (err) {
          console.warn('Error binding popup:', err);
        }

        // Click handler
        layer.on('click', (e) => {
          e.stopPropagation();
          setSelectedListing(feature.properties);
          setShowSidebar(true);
        });

        // Hover effects for polygons
        if (layer.setStyle) {
          layer.on('mouseover', () => {
            try {
              layer.setStyle({
                weight: 3,
                opacity: 0.9,
                fillOpacity: 0.3
              });
              layer.bringToFront();
            } catch (err) {
              console.warn('Error on mouseover:', err);
            }
          });

          layer.on('mouseout', () => {
            try {
              layer.setStyle({
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.15
              });
            } catch (err) {
              console.warn('Error on mouseout:', err);
            }
          });
        }
      }
    }).addTo(map.current);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchListingsInViewport();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '' });
    setTimeout(() => fetchListingsInViewport(), 0);
  };

  // Fetch full listing details
  const fetchListingDetails = async (listingId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/listings/${listingId}`
      );

      if (response.data.success && map.current) {
        setSelectedListing(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching listing details:', err);
      // Show error but don't crash
      if (map.current) {
        setError('Failed to fetch listing details');
      }
    }
  };

  // Handle listing click from sidebar
  const handleListingSelect = (listing) => {
    fetchListingDetails(listing._id);
    setShowSidebar(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Map Container */}
      <div className="flex-1 flex flex-col">
        <div
          ref={mapContainer}
          className="flex-1"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Left Sidebar - Filters */}
      <div className="w-72 bg-gradient-to-b from-gray-50 to-white shadow-xl flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🗺️</span>
            <h2 className="text-lg font-bold">Property Search</h2>
          </div>
          <p className="text-blue-100 text-xs">Find your perfect property</p>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>📦</span> Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            >
              <option value="">All Categories</option>
              <option value="land">🌾 Land</option>
              <option value="house">🏠 House</option>
              <option value="apartment">🏢 Apartment</option>
              <option value="commercial">🏬 Commercial</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>💰</span> Price Range
            </label>
            <div className="space-y-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg hover:shadow-lg disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2"
            >
              {loading ? '🔍 Searching...' : '🔍 Apply Filters'}
            </button>
            <button
              onClick={resetFilters}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              ↺ Reset
            </button>
          </div>

          {/* Listings Counter */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm font-semibold text-gray-700">
              📍 {listings.length} {listings.length === 1 ? 'Property' : 'Properties'} Found
            </p>
          </div>

          {/* Listings List */}
          <div className="border-t pt-4">
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-xs mb-3 font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {listings.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  📍 No listings found.<br/>Pan/zoom the map to load properties.
                </p>
              ) : (
                listings.map(listing => {
                  const categoryIcons = {
                    land: '🌾',
                    house: '🏠',
                    apartment: '🏢',
                    commercial: '🏬'
                  };
                  const icon = categoryIcons[listing.category] || '📍';

                  return (
                    <div
                      key={listing._id}
                      onClick={() => handleListingSelect(listing)}
                      className="p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md hover:bg-blue-50 transition-all group"
                    >
                      {/* Thumbnail if available */}
                      {listing.photos && listing.photos.length > 0 && (
                        <div className="mb-2 rounded overflow-hidden h-20 bg-gray-200">
                          <img 
                            src={listing.photos[0]} 
                            alt="Property" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 truncate">{listing.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{listing.address}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-sm text-blue-600">
                              {listing.price} {listing.currency}
                            </p>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {listing.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Listing Details */}
      {showSidebar && selectedListing && (
        <div className="w-96 bg-white shadow-2xl flex flex-col border-l border-gray-200">
          {/* Header with Image */}
          <div className="relative h-48 bg-gray-200 overflow-hidden">
            {selectedListing.photos && selectedListing.photos.length > 0 ? (
              <img 
                src={selectedListing.photos[0]} 
                alt="Property" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <span className="text-6xl">📷</span>
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => setShowSidebar(false)}
              className="absolute top-2 right-2 bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition text-xl"
            >
              ✕
            </button>

            {/* Category Badge */}
            {selectedListing.category && (
              <div className="absolute top-2 left-2">
                <span className="px-3 py-1.5 rounded-full text-white text-xs font-bold capitalize" style={{
                  background: {
                    land: '#10b981',
                    house: '#f59e0b',
                    apartment: '#3b82f6',
                    commercial: '#ef4444'
                  }[selectedListing.category] || '#6366f1'
                }}>
                  {selectedListing.category}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Title and Price */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h3>
              <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                📍 {selectedListing.address}
              </p>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
              <p className="text-gray-700 text-xs font-semibold mb-1">💰 Price</p>
              <p className="text-3xl font-bold text-blue-700">
                {selectedListing.price}
                <span className="text-lg ml-1 text-blue-600">{selectedListing.currency || 'USD'}</span>
              </p>
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {selectedListing.areaSize && (
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-gray-700 text-xs font-semibold mb-1">📐 Area Size</p>
                  <p className="font-bold text-green-700">
                    {selectedListing.areaSize.value} {selectedListing.areaSize.unit}
                  </p>
                </div>
              )}
              {selectedListing.city && (
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <p className="text-gray-700 text-xs font-semibold mb-1">🏙️ City</p>
                  <p className="font-bold text-purple-700">{selectedListing.city}</p>
                </div>
              )}
              {selectedListing.country && (
                <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <p className="text-gray-700 text-xs font-semibold mb-1">🌍 Country</p>
                  <p className="font-bold text-orange-700">{selectedListing.country}</p>
                </div>
              )}
              {(selectedListing.views || selectedListing.favorites) && (
                <div className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                  <p className="text-gray-700 text-xs font-semibold mb-1">❤️ Favorites</p>
                  <p className="font-bold text-pink-700">{selectedListing.favorites || 0}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedListing.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  📝 Description
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {selectedListing.description}
                </p>
              </div>
            )}

            {/* Photos Gallery */}
            {selectedListing.photos && selectedListing.photos.length > 1 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  🖼️ Photos
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedListing.photos.slice(1).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Property ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seller Info */}
            {selectedListing.seller && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  👤 Seller Information
                </h4>
                <div className="space-y-2">
                  {selectedListing.seller.name && (
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Name</p>
                      <p className="text-gray-900 font-medium">{selectedListing.seller.name}</p>
                    </div>
                  )}
                  {selectedListing.seller.email && (
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Email</p>
                      <a
                        href={`mailto:${selectedListing.seller.email}`}
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        ✉️ {selectedListing.seller.email}
                      </a>
                    </div>
                  )}
                  {selectedListing.seller.phone && (
                    <div>
                      <p className="text-gray-600 text-xs font-semibold">Phone</p>
                      <a
                        href={`tel:${selectedListing.seller.phone}`}
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        📞 {selectedListing.seller.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Engagement Stats */}
            {(selectedListing.views || selectedListing.favorites) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 text-center">
                  <p className="text-gray-700 text-xs font-semibold mb-1">👁️ Views</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedListing.views || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200 text-center">
                  <p className="text-gray-700 text-xs font-semibold mb-1">❤️ Favorites</p>
                  <p className="text-2xl font-bold text-rose-700">{selectedListing.favorites || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t space-y-3 bg-gray-50">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2">
              📞 Contact Seller
            </button>
            <button className="w-full bg-white border-2 border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 transition font-bold flex items-center justify-center gap-2">
              ❤️ Add to Favorites
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
