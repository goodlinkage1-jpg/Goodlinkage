// components/chat/InlineChat.js
import React, { useState, useEffect, useRef } from 'react';

import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../../Config';

const InlineChat = ({ userId, userName, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Polling interval for checking new messages (in milliseconds)
  const POLLING_INTERVAL = 5000; // 5 seconds
  
  useEffect(() => {
    // Initialize chat
    initializeChat();
    console.log("The user id is ", userId);
    
    // Set up polling for new messages
    const pollingInterval = setInterval(() => {
      if (chat && !minimized) {
        fetchMessages(chat._id, false); // Don't show loading state for polling
      }
    }, POLLING_INTERVAL);
    
    // Focus on message input
    setTimeout(() => {
      if (!minimized) {
        messageInputRef.current?.focus();
      }
    }, 100);
    
    // Clean up on unmount
    return () => clearInterval(pollingInterval);
  }, [userId, minimized, chat]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Create or get existing chat with this user
      const response = await axios.get(`${API_URL}/chats/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Chat initialization response:", response.data);
      
      if (response.data && response.data.success) {
        // Make sure we're setting the chat object correctly
        setChat(response.data.data);
        console.log("Chat ID:", response.data.data._id);
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to load chat. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (chatId, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      
      // Make sure to use the correct API endpoint
      const response = await axios.get(`${API_URL}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (showLoading) {
        // setError('Failed to load messages. Please try again later.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!chat || !newMessage.trim()) {
      return;
    }
    
    try {
      setSending(true);
      
      const token = localStorage.getItem('accessToken');
      const chatId = chat._id;
      
      console.log('Sending message to chat with ID:', chatId);
      
      if (!chatId) {
        console.error('Chat ID is undefined or null');
        setError('Chat session not properly initialized. Please try again.');
        setSending(false);
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/chats/${chatId}/messages`,
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.success) {
        // Refresh messages
        fetchMessages(chatId, false);
        
        // Clear input field
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };
  
  const toggleMinimize = () => {
    setMinimized(!minimized);
  };
  
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Function to group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      const dateString = date.toLocaleDateString();
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  // Function to get avatar for message
  const getMessageAvatar = (message, isCurrentUser) => {
    if (isCurrentUser) {
      return currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Me')}&background=6366f1&color=fff`;
    } else {
      return message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`;
    }
  };

  // Group messages for display
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col">
      <div 
        className={`bg-white rounded-lg shadow-xl flex flex-col transition-all duration-300 ${
          minimized ? 'w-72 h-12' : 'w-80 md:w-96'
        }`}
        style={{ height: minimized ? '48px' : '400px' }}
      >
        {/* Chat Header */}
        <div 
          className="p-3 border-b border-gray-200 flex items-center justify-between bg-indigo-600 text-white rounded-t-lg cursor-pointer"
          onClick={toggleMinimize}
        >
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold mr-2 overflow-hidden">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-white">{userName}</h3>
              <span className="text-xs text-indigo-200">
                {minimized ? 'Click to expand' : 'Online'}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            {!minimized && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(true);
                }}
                className="text-white mr-2 hover:text-indigo-100 p-1 rounded-full hover:bg-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:text-indigo-100 p-1 rounded-full hover:bg-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Messages - only shown when not minimized */}
        {!minimized && (
          <>
            <div 
              ref={messagesContainerRef}
              className="flex-1 p-3 overflow-y-auto bg-gray-50"
            >
              {loading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation by typing a message below.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                      {/* Date separator */}
                      <div className="flex items-center justify-center">
                        <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {new Date(group.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      
                      {/* Messages */}
                      {group.messages.map((message, messageIndex) => {
                        const isCurrentUser = message.sender._id === currentUser?.userId;
                        const showAvatar = messageIndex === 0 || 
                                          group.messages[messageIndex - 1].sender._id !== message.sender._id;
                        const isLastInGroup = messageIndex === group.messages.length - 1 || 
                                             group.messages[messageIndex + 1].sender._id !== message.sender._id;
                        
                        return (
                          <div 
                            key={messageIndex}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            {/* Avatar for receiver (non-current user) */}
                            {!isCurrentUser && showAvatar && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2">
                                <img 
                                  src={getMessageAvatar(message, isCurrentUser)} 
                                  alt={message.sender.name || 'User'} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div 
                              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                isCurrentUser 
                                  ? 'bg-indigo-500 text-white rounded-br-none' 
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                              } ${!showAvatar && !isCurrentUser ? 'ml-10' : ''}`}
                            >
                              <p>{message.content}</p>
                              <span className={`text-xs ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'} block text-right mt-1`}>
                                {formatMessageTime(message.createdAt)}
                                {isCurrentUser && (
                                  <span className="ml-1">
                                    {message.isRead ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                      </svg>
                                    )}
                                  </span>
                                )}
                              </span>
                            </div>
                            
                            {/* Avatar for sender (current user) */}
                            {isCurrentUser && showAvatar && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ml-2">
                                <img 
                                  src={getMessageAvatar(message, isCurrentUser)} 
                                  alt="You" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-2 border-t border-gray-200 bg-white rounded-b-lg">
              {error && (
                <div className="mb-1 text-xs text-red-500 px-2">
                  {error}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  ref={messageInputRef}
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-r-lg transition-colors"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InlineChat;