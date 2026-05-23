import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../Config';
import axios from 'axios';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      if (response.data && response.data.data) {
        setPotentialMembers(response.data.data);
      } else {
        console.error('Unexpected data format:', response.data);
        setPotentialMembers([]);
      }
    } catch (error) {
      console.error('Error fetching potential members:', error.message);
      setPotentialMembers([]);
    } finally {
      setLoading(false);
    }
  };

// Update the handleCreateGroup function
const handleCreateGroup = async (e) => {
  e.preventDefault();
  
  if (!groupName.trim()) {
    setError('Group name is required');
    return;
  }
  
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    const response = await axios.post(
      `${API_URL}/groups`, 
      { 
        name: groupName,
        description,
        members: selectedMembers
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.success) {
      onGroupCreated(response.data.data);
    } else {
      setError('Failed to create group. Please try again.');
    }
  } catch (error) {
    console.error('Error creating group:', error);
    setError(error.response?.data?.message || 'Failed to create group');
  }
};

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleCreateGroup}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="groupName">
              Group Name *
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter group name"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter group description"
              rows="3"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Add Members ({selectedMembers.length} selected)
            </label>
            
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : potentialMembers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto border rounded p-2">
                {potentialMembers.map(user => (
                  <div 
                    key={user._id} 
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleMemberSelection(user._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No connections found. Follow some users first.</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={!groupName.trim() || loading}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;