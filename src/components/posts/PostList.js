import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Post from './Post';
import CreatePost from './CreatePost';
import { API_URL } from '../../../Config';

const PostList = ({ userId, initialFeedType = 'following' }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedType, setFeedType] = useState(initialFeedType);

  // Fetch posts based on current feed type
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('feedType', feedType);
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await axios.get(`${API_URL}/posts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setPosts(response.data.data);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when component mounts or feed type changes
  useEffect(() => {
    fetchPosts();
  }, [feedType, userId]);

  // Handle new post creation
  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Handle feed type change
  const handleFeedTypeChange = (type) => {
    setFeedType(type);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Create Post Component - Only show on following feed or profile */}
     
      
      {/* Feed Type Selector */}
      <div className="flex justify-center mb-6 bg-white rounded-lg shadow-md p-2">
        <button
          className={`px-4 py-2 mx-1 rounded-md ${feedType === 'following' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => handleFeedTypeChange('following')}
        >
          Following
        </button>
        <button
          className={`px-4 py-2 mx-1 rounded-md ${feedType === 'explore' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => handleFeedTypeChange('explore')}
        >
          Explore
        </button>
        {userId && (
          <button
            className={`px-4 py-2 mx-1 rounded-md ${feedType === 'profile' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => handleFeedTypeChange('profile')}
          >
            Profile
          </button>
        )}
      </div>
      
      {/* Feed Title */}
      <h2 className="text-xl font-bold mb-4">
        {feedType === 'following' && 'Posts from people you follow'}
        {feedType === 'explore' && 'Discover new content'}
        {feedType === 'profile' && 'Your posts'}
      </h2>
      
      {/* Posts List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md my-4">
          <p>{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          {feedType === 'following' ? (
            <>
              <p className="text-gray-500">Your feed is empty.</p>
              <p className="text-gray-500 mt-2">Start following people to see their posts here!</p>
            </>
          ) : feedType === 'explore' ? (
            <p className="text-gray-500">No posts to discover right now. Check back later!</p>
          ) : (
            <>
              <p className="text-gray-500">You haven't created any posts yet.</p>
              <p className="text-gray-500 mt-2">Create a new post to get started!</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {posts.map(post => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;