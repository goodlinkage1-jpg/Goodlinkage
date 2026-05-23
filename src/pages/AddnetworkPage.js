import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { API_URL } from '../../Config';
import { api } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AddNetworkPage = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [followData, setFollowData] = useState([]);
  const { currentUser } = useAuth();

  const fetchFollowData = async () => {
    try {
      // Get the token from localStorage (assuming you store it there after login)
      const token = localStorage.getItem('accessToken'); // or sessionStorage
      
      // If no token is found, handle accordingly
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Make the API request with the token in the Authorization header
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}` // Standard Bearer token format
        }
      });
      
      console.log('API Response:', response);
      
      // Check the structure of response.data
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If response.data.data is an array (common API structure)
        setFollowData(response.data.data);
      } else if (Array.isArray(response.data)) {
        // If response.data itself is already an array
        setFollowData(response.data);
      } else {
        // Fallback - set to empty array to prevent errors
        console.error('Unexpected data format:', response.data);
        setFollowData([]);
      }
      
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setLoading(false); // Also set loading to false in case of error
    }
  };

  useEffect(() => {
    // Fetch data when component mounts
    fetchFollowData();
  }, []); // Remove followData from the dependency array to prevent infinite loops

  const handleConnect = async (personId) => {
    try {
      setLoading(true); // Set loading state before making the request
  
      const token = localStorage.getItem('accessToken');
        
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
        
      const response = await axios.post(
        `${API_URL}/follow/${personId}`,
        {}, // Empty body or add data if needed
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
        
      console.log('Follow response:', response.data);
      
      // Refresh the list after successful connection
      await fetchFollowData();
  
      // Alternative: Remove the connected user from the list
      // setFollowData(prev => prev.filter(user => user._id !== personId));
      
    } catch (error) {
      console.error('Error connecting with person:', error);
      // Log detailed error information
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter followData based on search term
  // Make sure followData is an array before trying to filter
  const filteredData = Array.isArray(followData) 
    ? followData.filter(user => 
        user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
        // Add more filters if needed based on followData structure
      )
    : [];

  const PersonCard = ({ user }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="text-center pt-6">
      <img 
          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
          alt={user.name || 'User'} 
          className="w-24 h-24 mx-auto rounded-full object-cover"
         
        />
      </div>
      
      <div className="p-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg text-gray-800">{user.name}</h3>
          <p className="text-gray-600">{user.accounttype || "User"}</p>
          <p className="text-sm text-gray-500 mt-1">
            <span className="inline-block mr-1">📍</span> {user.country || "Not specified"}
          </p>
        </div>
        
        <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
            onClick={() => handleConnect(user._id)}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                People to Connect With 
                <span className="text-gray-500 text-lg ml-2">({filteredData.length})</span>
              </h2>
            </div>
            
            {filteredData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredData.map(user => (
                  <PersonCard key={user._id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No people match your search</p>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AddNetworkPage;