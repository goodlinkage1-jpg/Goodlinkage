import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import InlineChat from './InlineChat';
import { usePosts } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../../Config';
import axios from 'axios';

const NetworkPage = () => {
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myfollow, setMyfollow] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State for managing the inline chat
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const Mynetwork = async () => {
    try {
      // Get the token from localStorage (assuming you store it there after login)
      const token = localStorage.getItem('accessToken'); // or sessionStorage
      
      // If no token is found, handle accordingly
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/followers`, 
        {
          headers: 
          {
            Authorization: `Bearer ${token}`
          }
        });
      console.log('API Response:', response.data);
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If response.data.data is an array (common API structure)
        //setConnections(response.data.data);
        setConnections(response.data.data.map(follower => ({
          id: follower._id,
          name: follower.name,
          accounttype: follower.accounttype,
          country: follower.country,
          avatar: follower.avatar,
          isConnected: true
        })));
      } else if (Array.isArray(response.data)) {
        // If response.data itself is already an array
        //setConnections(response.data);
        setConnections(response.data.map(follower => ({
          id: follower._id,
          name: follower.name,
          accounttype: follower.accounttype,
          country: follower.country,
          avatar: follower.avatar,
          isConnected: true
        })));
      } else {
        // Fallback - set to empty array to prevent errors
        console.error('Unexpected data format:', response.data);
        setConnections([]);
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching Myfollow data:', error.message);
      setLoading(false); // Also set loading to false in case of error
    }
  };
  
  useEffect(() => {
    // This would typically be an API call
    // Simulating network data fetching
    Mynetwork();
  }, []);

  const handleConnect = (id) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
    setConnections(prev => [
      ...prev,
      {
        ...suggestions.find(suggestion => suggestion.id === id),
        isConnected: true
      }
    ]);
  };

  const handleUnfollow = async (id) => {
    try {
      console.log("Unfollow id", id);
      setLoading(true);
  
      const token = localStorage.getItem('accessToken');
        
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
        
      const response = await axios.delete(`${API_URL}/unfollow/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Unfollow response", response.data);
      
      // Remove the unfollowed connection from the state
      setConnections(prev => prev.filter(connection => connection.id !== id));
      
      // Refresh the network list (optional but recommended)
      await Mynetwork();
      
    } catch (error) {
      console.error('Error unfollowing:', error);
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  // New function to handle message button click - now opens inline chat
  const handleMessage = (user) => {
    setSelectedUser(user);
    setShowChat(true);
  };
  
  // Function to close the chat modal
  const closeChat = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  const ConnectionCard = ({ connection }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-start">
      <img 
        src={connection.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name || 'User')}&background=random`}
        alt={connection.name || 'User'} 
        className="w-10 h-10 rounded-full mr-3"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{connection.name}</h3>
        <p className="text-gray-600 text-sm">{connection.accounttype}</p>
        <p className="text-gray-500 text-xs">{connection.country}</p>
      </div>
      <div className="flex flex-col space-y-2">
        {connection.isConnected ? (
          <>
            <button 
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200"
              onClick={() => handleMessage(connection)}
            >
              Message
            </button>
            <button 
              className="px-3 py-1 bg-red-50 text-red-500 rounded-md text-sm hover:bg-red-100"
              onClick={() => handleUnfollow(connection.id)}
            >
              Unfollow
            </button>
          </>
        ) : (
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            onClick={() => handleConnect(connection.id)}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Your Connections ({connections.length})</h2>
                {connections.length > 0 ? (
                  <div className="space-y-3">
                    {connections.map(connection => (
                      <ConnectionCard key={connection.id} connection={connection} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You don't have any connections yet.</p>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Find people you know
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Render the inline chat component when showChat is true */}
        {showChat && selectedUser && (
          <InlineChat 
            userId={selectedUser.id}
            userName={selectedUser.name} 
            onClose={closeChat}
          />
        )}
      </div>
    </Layout>
  );
};

export default NetworkPage;