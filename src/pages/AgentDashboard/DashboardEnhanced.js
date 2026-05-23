import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AgentDashboardEnhanced = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [landListings, setLandListings] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalFavorites: 0,
    activeListings: 0
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch land listings
      const listingsResponse = await axios.get(`${API_URL}/api/listings/seller/${currentUser._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (listingsResponse.data.success) {
        const listings = listingsResponse.data.data;
        setLandListings(listings);

        // Calculate stats
        const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
        const totalFavorites = listings.reduce((sum, listing) => sum + (listing.favorites || 0), 0);

        setStats({
          totalListings: listings.length,
          totalViews: totalViews,
          totalFavorites: totalFavorites,
          activeListings: listings.filter(l => l.status === 'active').length
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome, {currentUser?.name}! 👋</h1>
        <p className="text-green-100 text-lg">Manage your land and real estate listings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b bg-white rounded-t-lg p-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-green-600 text-green-600 -mb-4'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-6 py-2 font-medium transition-colors ${
            activeTab === 'listings'
              ? 'border-b-2 border-green-600 text-green-600 -mb-4'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 My Listings ({landListings.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2 font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'border-b-2 border-green-600 text-green-600 -mb-4'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📈 Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Listings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalListings}</p>
                </div>
                <div className="text-4xl">📍</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Listings</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeListings}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Views</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalViews}</p>
                </div>
                <div className="text-4xl">👁️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Favorites</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalFavorites}</p>
                </div>
                <div className="text-4xl">❤️</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/land-selling"
                className="p-6 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center"
              >
                <div className="text-4xl mb-3">➕</div>
                <h3 className="font-bold text-gray-900">Add New Property</h3>
                <p className="text-sm text-gray-600 mt-2">List a new land or property</p>
              </Link>

              <Link
                to="/properties-map"
                className="p-6 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
              >
                <div className="text-4xl mb-3">🗺️</div>
                <h3 className="font-bold text-gray-900">View All Properties</h3>
                <p className="text-sm text-gray-600 mt-2">See all listings on map</p>
              </Link>

              <Link
                to="/land-selling"
                className="p-6 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center"
              >
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-bold text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600 mt-2">Check listing performance</p>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Listings</h2>
            {loading ? (
              <p className="text-center py-8 text-gray-600">Loading...</p>
            ) : landListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No listings yet</p>
                <Link
                  to="/land-selling"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Property</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Views</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {landListings.slice(0, 5).map(listing => (
                      <tr key={listing._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{listing.title}</p>
                          <p className="text-sm text-gray-600">{listing.category}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.address}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">{listing.price} {listing.currency}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.views || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {listing.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">All Your Listings</h2>
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : landListings.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">No listings yet. Start selling your first property!</p>
              <Link
                to="/land-selling"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Property Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landListings.map(listing => (
                <div key={listing._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-32 flex items-center justify-center">
                    <span className="text-white text-4xl">🏠</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">{listing.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                    <div className="mb-4 space-y-1">
                      <p className="text-sm"><span className="font-semibold">Price:</span> {listing.price} {listing.currency}</p>
                      <p className="text-sm"><span className="font-semibold">Location:</span> {listing.address}</p>
                      <p className="text-sm"><span className="font-semibold">Views:</span> {listing.views || 0}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm font-medium">
                        View
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-medium mb-2">Average Views Per Listing</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalListings > 0 ? Math.round(stats.totalViews / stats.totalListings) : 0}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border-l-4 border-red-600">
              <p className="text-gray-600 text-sm font-medium mb-2">Average Favorites Per Listing</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.totalListings > 0 ? Math.round(stats.totalFavorites / stats.totalListings) : 0}
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Tips to Increase Sales</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span>Add high-quality photos and detailed descriptions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span>Update your property listings regularly</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span>Respond quickly to buyer inquiries</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span>Use accurate boundary maps (KML files)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span>Highlight unique features of your property</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboardEnhanced;
