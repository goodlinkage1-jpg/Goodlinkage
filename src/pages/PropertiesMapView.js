import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';

const PropertiesMapView = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    priceMin: 0,
    priceMax: 10000000,
    searchText: '',
    showSold: false // Hide sold properties by default
  });
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const scriptLoadedRef = useRef(false);
  const mapInitializedRef = useRef(false);
  const infoWindowRef = useRef(null);
  const polygonsRef = useRef([]);
  const markersRef = useRef([]);

  // Dynamic API URL to match backend environment
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
    }
    return 'https://goodlinkage-api.vercel.app';
  };

  const API_URL = getApiUrl();

  // Initialize Google Map - Load script only once
  useEffect(() => {
    const initializeMap = () => {
      if (!mapInitializedRef.current && window.google?.maps?.Map) {
        mapInitializedRef.current = true;
        const mapElement = document.getElementById('map-container');
        if (mapElement) {
          try {
            const newMap = new window.google.maps.Map(mapElement, {
              zoom: 8,
              center: { lat: -1.9441, lng: 29.8739 }, // Kigali, Rwanda
              mapTypeId: 'hybrid', // ✅ Hybrid = satellite + place names
              tilt: 0,               // Flat top-down view (no 45° tilt)
              mapTypeControl: true,  // Allow user to switch between satellite/roadmap
              mapTypeControlOptions: {
                style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: window.google.maps.ControlPosition.TOP_RIGHT,
                mapTypeIds: ['satellite', 'hybrid', 'roadmap', 'terrain']
              }
            });
            setMap(newMap);
            console.log('✅ Google Map initialized');
            console.log('Current USerID', currentUser._id);
          } catch (error) {
            console.error('❌ Error initializing map:', error);
          }
        }
      }
    };

    if (scriptLoadedRef.current) {
      if (window.google?.maps?.Map) {
        initializeMap();
      } else {
        const checkGoogle = setInterval(() => {
          if (window.google?.maps?.Map) {
            clearInterval(checkGoogle);
            initializeMap();
          }
        }, 100);
      }
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      scriptLoadedRef.current = true;
      const waitForGoogle = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(waitForGoogle);
          initializeMap();
        }
      }, 100);
      return;
    }

    scriptLoadedRef.current = true;

    const script = document.createElement('script');
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;
    
    if (!apiKey) {
      console.error('❌ Google Maps API key not found.');
      console.error('🔧 FIX: In Vercel, set environment variable as: REACT_APP_GOOGLE_MAPS_KEY=<your_key>');
      console.error('💡 Note: The REACT_APP_ prefix is REQUIRED for frontend env vars (webpack convention)');
      console.error('📝 Locally: Add to .env file as REACT_APP_GOOGLE_MAPS_KEY=<your_key>');
      scriptLoadedRef.current = false;
      return;
    }
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    const checkGoogleReady = () => {
      if (window.google?.maps?.Map) {
        initializeMap();
      } else {
        setTimeout(checkGoogleReady, 100);
      }
    };

    script.onload = checkGoogleReady;
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps script');
      console.error('Please verify:');
      console.error('1. API key (REACT_APP_GOOGLE_MAPS_KEY) is correctly set in Vercel');
      console.error('2. Maps JavaScript API is enabled in Google Cloud Console');
      console.error('3. API key restrictions allow Vercel domain(s)');
      console.error('4. Rebuild/redeploy after setting env vars in Vercel');
      scriptLoadedRef.current = false;
    };

    document.head.appendChild(script);

    // Cleanup — reset refs so map reinitializes on remount
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      polygonsRef.current.forEach(polygon => polygon.setMap(null));
      polygonsRef.current = [];
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // ✅ FIX: reset these so the map can reinitialize if component remounts
      mapInitializedRef.current = false;
      setMap(null);
    };
  }, []);

  // Fetch listings
  useEffect(() => {
    fetchListings();
  }, []);

  // Update map markers when listings change
  useEffect(() => {
    if (map && filteredListings.length > 0) {
      renderMarkersOnMap();
    }
  }, [map, filteredListings]);

  // Filter listings when filters change
  useEffect(() => {
    filterListings();
  }, [listings, filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      console.log('🌐 PropertiesMapView - Fetching listings');
      console.log('📍 API URL:', API_URL);

      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token available:', !!token);

      // Include sold parameter to get all listings, filter on client side
      const response = await axios.get(`${API_URL}/api/listings?includeSold=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response:', {
        status: response.status,
        success: response.data.success,
        count: response.data.listings?.length || response.data.data?.length,
        cached: response.data.cached
      });

      if (response.data.success) {
        const listingsData = response.data.data || response.data.listings || [];
        console.log(`✅ Got ${listingsData.length} listings for map`);
        setListings(listingsData);
      }
    } catch (err) {
      console.error('❌ Error fetching listings:', err.message);
      console.error('   Status:', err.response?.status);
      console.error('   Data:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleListingStatus = async (listingId, currentStatus) => {
    try {
      setStatusUpdating(true);
      setStatusMessage('');
      const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `${API_URL}/api/listings/${listingId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStatusMessage(`✅ Property marked as ${newStatus.toUpperCase()}`);
        // Update the listing in state
        setListings(prev => 
          prev.map(listing => 
            listing._id === listingId ? { ...listing, status: newStatus } : listing
          )
        );
        // Update selected listing
        if (selectedListing?._id === listingId) {
          setSelectedListing(prev => ({ ...prev, status: newStatus }));
        }
        // Clear message after 3 seconds
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error updating listing status:', err);
      setStatusMessage('❌ Failed to update property status. Make sure it\'s your property.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleMapNavigateToProperty = (listing) => {
    if (!map || !listing.geometry || !listing.geometry.coordinates) {
      console.warn('Cannot navigate to property: invalid geometry or map');
      return;
    }

    // Set the selected listing to show details panel
    setSelectedListing(listing);

    // Calculate bounds based on geometry type
    const bounds = new window.google.maps.LatLngBounds();

    if (listing.geometry.type === 'Polygon') {
      const coordinatesArray = listing.geometry.coordinates[0];
      coordinatesArray.forEach(coord => {
        bounds.extend(new window.google.maps.LatLng(coord[1], coord[0]));
      });
    } else if (listing.geometry.type === 'Point') {
      const [lng, lat] = listing.geometry.coordinates;
      bounds.extend(new window.google.maps.LatLng(lat, lng));
    }

    // Pan and zoom to the property with padding
    const padding = {
      top: 100,
      right: 100,
      bottom: 300, // Extra bottom padding for sidebar
      left: 100
    };

    map.fitBounds(bounds, padding);

    // Limit zoom level to max 15 for context visibility
    const zoomListener = window.google.maps.event.addListener(map, 'zoom_changed', () => {
      const zoomLevel = map.getZoom();
      if (zoomLevel > 15) {
        map.setZoom(15);
      }
      window.google.maps.event.removeListener(zoomListener);
    });

    // Scroll to map on mobile
    const mapElement = document.getElementById('map-container');
    if (mapElement) {
      setTimeout(() => {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const filterListings = () => {
    if (!listings || listings.length === 0) {
      setFilteredListings([]);
      return;
    }

    let filtered = listings.filter(listing => {
      const matchesCategory = filters.category === 'all' || listing.category === filters.category;
      const matchesPrice = listing.price >= filters.priceMin && listing.price <= filters.priceMax;
      const matchesSearch = filters.searchText === '' ||
        listing.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        listing.description.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        listing.address.toLowerCase().includes(filters.searchText.toLowerCase());
      
      // Filter by status: by default hide sold properties unless showSold is true
      const matchesStatus = filters.showSold || listing.status !== 'sold';

      return matchesCategory && matchesPrice && matchesSearch && matchesStatus;
    });

    setFilteredListings(filtered);
  };

  const renderMarkersOnMap = () => {
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      console.warn('Google Maps not yet loaded');
      return;
    }

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    polygonsRef.current.forEach(polygon => polygon.setMap(null));
    polygonsRef.current = [];

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    setMarkers([]);

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    filteredListings.forEach((listing) => {
      if (listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates[0]) {
        const coordinatesArray = listing.geometry.coordinates[0];
        const [lng, lat] = coordinatesArray[0];

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (!isFinite(latNum) || !isFinite(lngNum)) {
          console.warn(`⚠️ Invalid coordinates for ${listing.title}: lat=${lat}, lng=${lng}`);
          return;
        }

        const polygonCoordinates = coordinatesArray.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0])
        }));

        // Use different colors based on status
        const isSold = listing.status === 'sold';
        const strokeColor = isSold ? '#9ca3af' : '#16a34a';
        const fillColor = isSold ? '#f3f4f6' : '#16a34a';
        const fillOpacity = isSold ? 0.15 : 0.25;

        const polygon = new window.google.maps.Polygon({
          paths: polygonCoordinates,
          strokeColor: strokeColor,
          strokeOpacity: isSold ? 0.5 : 0.8,
          strokeWeight: 3,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          map,
          title: listing.title
        });

        const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(
          polygonCoordinates.map(c => new window.google.maps.LatLng(c.lat, c.lng))
        );

        const areaHectares = (areaSquareMeters / 10000).toFixed(2);
        const areaAcres = (areaSquareMeters / 4046.86).toFixed(2);

        const statusBadge = isSold ? '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 6px;">SOLD</span>' : '';
        const infoContent = `
          <div style="max-width: 350px; padding: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h3 style="margin: 0; font-weight: bold; font-size: 15px; color: ${isSold ? '#9ca3af' : '#16a34a'};">${listing.title}</h3>
              ${statusBadge}
            </div>
            <p style="margin: 6px 0; font-size: 12px; color: #666;"><strong>Location:</strong> ${listing.address}</p>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>City:</strong> ${listing.city || 'N/A'}</p>
            <div style="background: ${isSold ? '#f3f4f6' : '#f0fdf4'}; padding: 8px; border-radius: 4px; margin: 6px 0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: ${isSold ? '#9ca3af' : '#16a34a'};">📐 Plot Size:</p>
              <p style="margin: 0; font-size: 11px; color: #666;">${areaHectares} hectares | ${areaAcres} acres</p>
            </div>
            <p style="margin: 6px 0; color: ${isSold ? '#9ca3af' : '#16a34a'}; font-weight: bold; font-size: 13px;">${new Intl.NumberFormat().format(listing.price)} ${listing.currency}</p>
            <p style="margin: 6px 0; font-size: 12px; color: #666;"><strong>Category:</strong> ${listing.category}</p>
          </div>
        `;

        polygon.addListener('click', (event) => {
          if (infoWindowRef.current) infoWindowRef.current.close();
          setSelectedListing(listing);
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
            position: event.latLng
          });
          infoWindowRef.current = infoWindow;
          infoWindow.open(map);
        });

        polygon.addListener('mouseover', () => {
          polygon.setOptions({ fillOpacity: 0.4, strokeWeight: 4 });
        });

        polygon.addListener('mouseout', () => {
          polygon.setOptions({ fillOpacity: fillOpacity, strokeWeight: 3 });
        });

        polygonsRef.current.push(polygon);

        const marker = new window.google.maps.Marker({
          position: { lat: latNum, lng: lngNum },
          map,
          title: listing.title,
          label: {
            text: `${areaHectares}ha`,
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isSold ? '#9ca3af' : '#16a34a',
            fillOpacity: isSold ? 0.7 : 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current) infoWindowRef.current.close();
          setSelectedListing(listing);
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="max-width: 350px; padding: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <h3 style="margin: 0; font-weight: bold; font-size: 15px; color: ${isSold ? '#9ca3af' : '#16a34a'};">${listing.title}</h3>
                  ${statusBadge}
                </div>
                <p style="margin: 6px 0; font-size: 12px; color: #666;"><strong>Location:</strong> ${listing.address}</p>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>City:</strong> ${listing.city || 'N/A'}</p>
                <div style="background: ${isSold ? '#f3f4f6' : '#f0fdf4'}; padding: 8px; border-radius: 4px; margin: 6px 0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: ${isSold ? '#9ca3af' : '#16a34a'};">📐 Plot Size:</p>
                  <p style="margin: 0; font-size: 11px; color: #666;">${areaHectares} hectares | ${areaAcres} acres</p>
                </div>
                <p style="margin: 6px 0; color: ${isSold ? '#9ca3af' : '#16a34a'}; font-weight: bold; font-size: 13px;">${new Intl.NumberFormat().format(listing.price)} ${listing.currency}</p>
                <p style="margin: 6px 0; font-size: 12px; color: #666;"><strong>Category:</strong> ${listing.category}</p>
                <p style="margin: 6px 0; font-size: 12px; color: #666;"><strong>Description:</strong> ${listing.description}</p>
              </div>
            `
          });
          infoWindowRef.current = infoWindow;
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        markersRef.current.push(marker);
        bounds.extend(marker.getPosition());
      }
    });

    if (newMarkers.length > 0) {
      // Use fitBounds with padding to see properties clearly with context
      const padding = {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100
      };
      map.fitBounds(bounds, padding);

      // Limit zoom level to not go too far in (max zoom 15)
      // This keeps the map context visible (roads, surrounding areas)
      const zoomListener = window.google.maps.event.addListener(map, 'zoom_changed', () => {
        const zoomLevel = map.getZoom();
        if (zoomLevel > 15) {
          map.setZoom(15);
        }
        window.google.maps.event.removeListener(zoomListener);
      });
    }

    setMarkers(newMarkers);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name.includes('price') ? parseFloat(value) : value
    }));
  };

  const categories = ['residential', 'commercial', 'agricultural', 'industrial', 'mixed'];

  const getPlotArea = (listing) => {
    if (!window.google || !window.google.maps || !window.google.maps.geometry) return null;
    if (!listing.geometry || !listing.geometry.coordinates || !listing.geometry.coordinates[0]) return null;

    const coordinatesArray = listing.geometry.coordinates[0];
    const polygonCoordinates = coordinatesArray.map(coord => ({
      lat: parseFloat(coord[1]),
      lng: parseFloat(coord[0])
    }));

    if (polygonCoordinates.length < 3) return null;

    try {
      const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(
        polygonCoordinates.map(c => new window.google.maps.LatLng(c.lat, c.lng))
      );
      return {
        hectares: (areaSquareMeters / 10000).toFixed(2),
        acres: (areaSquareMeters / 4046.86).toFixed(2)
      };
    } catch (error) {
      console.warn('Error calculating plot area:', error);
      return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🗺️ Properties Map View</h1>
          <p className="text-blue-100 text-lg">Explore all available properties on an interactive satellite map</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-6">Filters</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    name="priceMin"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="priceMax"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Search</label>
                <input
                  type="text"
                  name="searchText"
                  placeholder="Property name, location..."
                  value={filters.searchText}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="showSold"
                    checked={filters.showSold}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        showSold: e.target.checked
                      }));
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-2">Show Sold Properties</span>
                </label>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-gray-600">
                  <strong>{filteredListings.length}</strong> properties found
                </p>
              </div>

              <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
                {filteredListings.map(listing => {
                  const plotArea = getPlotArea(listing);
                  const isSold = listing.status === 'sold';
                  return (
                    <div
                      key={listing._id}
                      onClick={() => handleMapNavigateToProperty(listing)}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedListing?._id === listing._id
                          ? 'bg-blue-100 border-2 border-blue-600 shadow-md'
                          : 'bg-gray-50 border hover:bg-gray-100'
                      } ${isSold ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{listing.title}</h4>
                        {isSold && (
                          <span className="flex-shrink-0 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">SOLD</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{listing.address}</p>
                      {plotArea && (
                        <p className="text-xs text-green-600 font-semibold mt-1">📐 {plotArea.hectares}ha ({plotArea.acres}ac)</p>
                      )}
                      <p className="text-xs font-bold text-blue-600 mt-1">{listing.price} {listing.currency}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-3">

            {/* ✅ FIX: Wrapper div owns the height; loading overlay is a sibling of map-container
                using absolute positioning — React never touches map-container's children */}
            <div className="relative rounded-lg shadow-lg mb-6" style={{ height: '500px' }}>

              {/* Loading overlay — absolutely positioned SIBLING of map-container, not inside it */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">Loading map...</p>
                  </div>
                </div>
              )}

              {/* ✅ map-container is EMPTY — Google Maps owns its DOM entirely */}
              <div
                id="map-container"
                style={{ width: '100%', height: '100%' }}
                className="rounded-lg"
              />
            </div>

            {/* Selected Property Details */}
            {selectedListing && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                      {selectedListing.status === 'sold' && (
                        <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">SOLD</span>
                      )}
                      {selectedListing.status === 'active' && (
                        <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">AVAILABLE</span>
                      )}
                    </div>
                    <div className="flex items-center mt-2 text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                      {selectedListing.address}
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{selectedListing.price} {selectedListing.currency}</span>
                </div>

                {getPlotArea(selectedListing) && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-green-800 mb-2">📐 Plot Dimensions</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Hectares</p>
                        <p className="text-xl font-bold text-green-700">{getPlotArea(selectedListing).hectares}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Acres</p>
                        <p className="text-xl font-bold text-green-700">{getPlotArea(selectedListing).acres}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">Category</p>
                    <p className="font-semibold text-gray-900">{selectedListing.category}</p>
                  </div>
                  {selectedListing.areaSize && (
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">Area</p>
                      <p className="font-semibold text-gray-900">
                        {/* areaSize may be an object {value, unit} or a plain number */}
                        {typeof selectedListing.areaSize === 'object'
                          ? `${selectedListing.areaSize.value ?? ''} ${selectedListing.areaSize.unit ?? ''}`.trim()
                          : `${selectedListing.areaSize} ${selectedListing.areaSizeUnit ?? ''}`.trim()
                        }
                      </p>
                    </div>
                  )}
                  {selectedListing.city && (
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">City</p>
                      <p className="font-semibold text-gray-900">{selectedListing.city}</p>
                    </div>
                  )}
                  {selectedListing.country && (
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">Country</p>
                      <p className="font-semibold text-gray-900">{selectedListing.country}</p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{selectedListing.description}</p>
                </div>

                {/* 📸 Property Photos Section */}
                {selectedListing.photos && selectedListing.photos.length > 0 ? (
                  <div className="mb-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">📸 Property Photos ({selectedListing.photos.length})</h3>
                    </div>
                    
                    {/* Photo Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedListing.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gray-100"
                          style={{ aspectRatio: '1/1' }}
                        >
                          <img
                            src={photo}
                            alt={`Property photo ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3Ctext x='50%' y='50%' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EPhoto unavailable%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          {/* Photo number badge */}
                          <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {index + 1}/{selectedListing.photos.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 border-t pt-6">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500 text-sm">📸 No photos available for this property</p>
                    </div>
                  </div>
                )}

                {selectedListing.seller && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
                    <div className="flex items-start gap-4">
                      <img
                        src={selectedListing.seller.avatar || `https://ui-avatars.com/api/?name=${selectedListing.seller.name}`}
                        alt={selectedListing.seller.name}
                        className="w-12 h-12 rounded-full mr-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{selectedListing.seller.name}</p>
                        {selectedListing.seller.email && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                            </svg>
                            {selectedListing.seller.email}
                          </p>
                        )}
                        {selectedListing.seller.phone && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.8c.164.99.738 1.95 1.6 2.811.856.859 1.815 1.432 2.811 1.597a1 1 0 01.799.986V17a1 1 0 01-1 1h-2.57a1 1 0 01-.993-.883C3.29 15.133 1 10.977 1 7V3z"></path>
                            </svg>
                            {selectedListing.seller.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {statusMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${statusMessage.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    {statusMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex gap-4">
                    <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Seller
                    </button>
                    <button className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                      Add to Favorites
                    </button>
                  </div>

                  {/* Mark as Sold/Available Button - Only show for property owner */}
                  {currentUser && selectedListing.seller && currentUser.id === selectedListing.seller._id && (
                    <button
                      onClick={() => handleToggleListingStatus(selectedListing._id, selectedListing.status)}
                      disabled={statusUpdating}
                      className={`w-full px-6 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedListing.status === 'sold'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      } ${statusUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {statusUpdating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          {selectedListing.status === 'sold' ? '✅ Mark as Available' : '🔴 Mark as Sold'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!selectedListing && filteredListings.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">Select a property from the list to view details</p>
              </div>
            )}

            {filteredListings.length === 0 && !loading && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No properties match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertiesMapView;