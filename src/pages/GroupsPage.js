import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../../Config';
import axios from 'axios';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import GroupCard from '../components/groups/GroupCard';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch user's groups
// Update the fetchGroups function
const fetchGroups = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No authentication token found');
      setLoading(false);
      return;
    }
    
    const response = await axios.get(`${API_URL}/groups`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.data) {
      setGroups(response.data.data);
    } else {
      console.error('Unexpected data format:', response.data);
      setGroups([]);
    }
  } catch (error) {
    console.error('Error fetching groups:', error.message);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, newGroup]);
    setShowCreateModal(false);
  };

  const handleGroupSelect = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Groups</h1>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handleCreateGroup}
          >
            Create New Group
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length > 0 ? (
              groups.map(group => (
                <GroupCard 
                  key={group._id} 
                  group={group} 
                  onClick={() => handleGroupSelect(group._id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">You're not a member of any groups yet.</p>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={handleCreateGroup}
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        )}

        {showCreateModal && (
          <CreateGroupModal 
            onClose={() => setShowCreateModal(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}
      </div>
    </Layout>
  );
};

export default GroupsPage;