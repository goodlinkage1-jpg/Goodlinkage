import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../../Config';
import axios from 'axios';
import MembersList from '../components/groups/MembersList';
import AddMemberModal from '../components/groups/AddMemberModal';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  // Poll for new messages every 3 seconds
  const pollInterval = useRef(null);
  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Fetch group details
      const groupResponse = await axios.get(`${API_URL}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (groupResponse.data && groupResponse.data.data) {
        setGroup(groupResponse.data.data);
      } else {
        console.error('Unexpected group data format:', groupResponse.data);
      }
      
      // Fetch group messages
      const messagesResponse = await axios.get(`${API_URL}/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (messagesResponse.data && messagesResponse.data.data) {
        setMessages(messagesResponse.data.data);
      } else {
        console.error('Unexpected messages data format:', messagesResponse.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching group details:', error.message);
      // If the error is 404 or 403, navigate back to groups page
      if (error.response && (error.response.status === 404 || error.response.status === 403)) {
        navigate('/groups');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGroupDetails();
    
    // Set up polling for new messages
    pollInterval.current = setInterval(() => {
      if (groupId) fetchMessages();
    }, 3000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [groupId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error.message);
    }
  };
  
// Update the message sending function
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  if (!messageText.trim()) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    await axios.post(
      `${API_URL}/groups/${groupId}/messages`, 
      { content: messageText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    setMessageText('');
    fetchMessages();
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
  
  const handleAddMember = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) return;
      
      await axios.post(`${API_URL}/groups/${groupId}/members`, 
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh group details
      fetchGroupDetails();
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member:', error.message);
    }
  };
  
  const handleRemoveMember = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) return;
      
      await axios.delete(`${API_URL}/groups/${groupId}/members/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // If current user is removed, go back to groups page
      if (userId === currentUser?.id) {
        navigate('/groups');
        return;
      }
      
      // Refresh group details
      fetchGroupDetails();
    } catch (error) {
      console.error('Error removing member:', error.message);
    }
  };
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (!group) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Group not found or you don't have access.</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => navigate('/groups')}
          >
            Back to Groups
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md">
          {/* Group Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src={group.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`}
                alt={group.name} 
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h1 className="font-bold text-lg">{group.name}</h1>
                <p className="text-gray-500 text-sm">{group.members?.length || 0} members</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200"
                onClick={() => setShowMembers(!showMembers)}
              >
                {showMembers ? 'Hide Members' : 'Show Members'}
              </button>
              {group.creator?._id === currentUser?.id && (
                <button 
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm hover:bg-blue-200"
                  onClick={() => setShowAddMember(true)}
                >
                  Add Members
                </button>
              )}
            </div>
          </div>
          
          <div className="flex h-[calc(100vh-240px)]">
            {/* Chat Area */}
            <div className={`flex flex-col ${showMembers ? 'w-2/3' : 'w-full'}`}>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div 
                        key={message._id} 
                        className={`flex ${message.sender._id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                          message.sender._id === currentUser?.id 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.sender._id !== currentUser?.id && (
                            <div className="flex items-center mb-1">
                              <img 
                                src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`}
                                alt={message.sender.name} 
                                className="w-4 h-4 rounded-full mr-1"
                              />
                              <span className="text-xs font-semibold">{message.sender.name}</span>
                            </div>
                          )}
                          <p>{message.content}</p>
                          <p className="text-xs text-right mt-1 opacity-70">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
            
            {/* Members Sidebar (Conditionally shown) */}
            {showMembers && (
              <div className="w-1/3 border-l p-4">
                <h2 className="font-semibold text-lg mb-4">Members</h2>
                <MembersList 
                  members={group.members || []}
                  creator={group.creator}
                  currentUserId={currentUser?.id}
                  onRemoveMember={handleRemoveMember}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal 
          groupId={groupId}
          existingMemberIds={group.members?.map(member => member._id) || []}
          onClose={() => setShowAddMember(false)}
          onAddMember={handleAddMember}
        />
      )}
    </Layout>
  );
};

export default GroupDetailPage;