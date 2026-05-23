import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../Config';
import axios from 'axios';

const AddMemberModal = ({ groupId, existingMemberIds, onClose, onAddMember }) => {
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPotentialMembers();
  }, []);

 const fetchPotentialMembers = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No authentication token found');
      setLoading(false);
      return;
    }
    
    const response = await axios.get(`${API_URL}/groups/potential-members`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data?.data?.members) {
      // Filter out users that are already members of the group
      const filteredMembers = response.data.data.members.filter(
        user => !existingMemberIds.includes(user._id)
      );
      setPotentialMembers(filteredMembers);
    } else {
      console.error('Unexpected data format:', response.data);
      setPotentialMembers([]);
    }
  } catch (error) {
    console.error('Error fetching potential members:', error.message);
    setPotentialMembers([]);
    setError('Failed to load connections. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Filter members based on search term
  const filteredMembers = potentialMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Members to Group</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search connections..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded">
              {filteredMembers.map(user => (
                <div 
                  key={user._id} 
                  className="flex items-center p-3 hover:bg-gray-100 border-b"
                >
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{user.name}</h3>
                    {user.email && (
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onAddMember(user._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              {searchTerm ? 'No matching connections found.' : 'No connections available to add.'}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;