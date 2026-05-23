import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../Config';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // Track which post is being deleted
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    // Don't proceed if currentUser hasn't loaded yet
    if (!userId) return;
    
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Reset state when viewing a different profile
        setUser(null);
        setPosts([]);
        setStats({
          postsCount: 0,
          followersCount: 0,
          followingCount: 0
        });
        
        const response = await axios.get(`${API_URL}/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.success) {
          setUser(response.data.data);
          
          // Check if this is the current user's profile - safely check if currentUser exists
          if (currentUser && currentUser.id === userId) {
            setIsCurrentUser(true);
          } else {
            setIsCurrentUser(false);
            // Check follow status only if this is not the current user's profile
            if (currentUser) {
              checkFollowStatus();
            }
          }
          
          // Safely log the current user ID - avoid the error that crashes the component
          if (currentUser) {
            console.log('Current User:', currentUser.id);
          }
          console.log('User:', response.data.data);
          
          // Fetch user stats
          fetchUserStats();
          
          // Fetch user posts
          fetchUserPosts();
        } else {
          setError('Failed to load user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.response?.data?.message || 'An error occurred while loading the profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId, currentUser]);
  
  // Check if the current user is following this profile
  const checkFollowStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/follow/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data.success) {
        setIsFollowing(response.data.data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };
  
  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };
  
  // Fetch user posts
  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await axios.get(`${API_URL}/posts/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data.success) {
        setPosts(response.data.data);
        // Update stats with correct posts count
      setStats(prevStats => ({
        ...prevStats,
        postsCount: response.data.data.length
      }));
        
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/follow/${userId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data.success) {
        setIsFollowing(response.data.data.isFollowing);
        // Update followers count
        fetchUserStats();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Delete a post
  const handleDeletePost = async (postId) => {
    if (deleteLoading === postId) return;
    
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setDeleteLoading(postId);
    
    try {
      const response = await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data.success) {
        // Remove the deleted post from the state
        setPosts(posts.filter(post => post._id !== postId));
        
        // Update the posts count in stats
        setStats(prevStats => ({
          ...prevStats,
          postsCount: prevStats.postsCount - 1
        }));
        
        // Show success message (optional)
        alert('Post deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.message || 'Failed to delete post. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };
  
  // Format account type for display
  const formatAccountType = (type) => {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : user ? (
          <div>
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                {user.coverPhoto && (
                  <img 
                    src={user.coverPhoto} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Profile structure with absolute positioning for avatar */}
                <div className="relative pt-16">
                  {/* Avatar - absolutely positioned */}
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 sm:left-0 sm:transform-none">
                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
                        }}
                      />
                    </div> 
                  </div>

                  {/* User info and action button */}
                  <div className="sm:pl-36">
                    {/* User Info */}
                    <div className="text-center sm:text-left mb-4">
                      <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
                      <p className="text-gray-600">{formatAccountType(user.accounttype)}</p>
                      <p className="text-gray-500 text-sm mt-1">{user.country || 'Location not specified'}</p>
                    </div>
                    
                    {/* Action Button */}
                    <div className="text-center sm:text-left">
                      {!isCurrentUser ? (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`px-6 py-2 rounded-full font-medium ${
                            isFollowing 
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          } transition-colors`}
                        >
                          {followLoading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing
                            </span>
                          ) : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      ) : (
                        <button
                          onClick={() => window.location.href = '/my-profile'}
                          className="px-6 py-2 rounded-full font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Stats Section */}
                <div className="flex justify-center sm:justify-start mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.postsCount}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div className="text-center px-4 border-l border-r border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{stats.followersCount}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.followingCount}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Tabs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button className="px-6 py-3 border-b-2 border-blue-500 font-medium text-blue-600">
                    Posts
                  </button>
                  <button className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700">
                    Photos
                  </button>
                  <button className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700">
                    About
                  </button>
                </div>
              </div>
              
              {/* Posts Section */}
              <div className="p-4">
                {loadingPosts ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post._id} className="bg-white border border-gray-200 rounded-lg p-4">
                        {/* Post Header with Delete Button for current user's posts */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <img 
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                              alt={user.name} 
                              className="w-8 h-8 rounded-full mr-3 object-cover" 
                            />
                            <div>
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-gray-500 text-xs">{new Date(post.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          
                          {/* Delete Button - Only shown if it's the current user's post */}
                          {isCurrentUser && (
                            <button 
                              onClick={() => handleDeletePost(post._id)}
                              disabled={deleteLoading === post._id}
                              className="text-gray-500 hover:text-red-500 transition-colors focus:outline-none"
                              aria-label="Delete post"
                            >
                              {deleteLoading === post._id ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                        
                        <p className="text-gray-800">{post.content}</p>
                        
                        {/* Post media */}
                        {post.media && post.media.length > 0 && (
                          <div className="mt-3">
                            <img 
                              src={post.media[0]} 
                              alt="Post media" 
                              className="rounded-lg w-full h-auto" 
                            />
                          </div>
                        )}
                        
                        {/* Post stats */}
                        <div className="flex justify-between items-center mt-4 pt-3 text-sm text-gray-500 border-t border-gray-100">
                          <div>{post.likes?.length || 0} likes</div>
                          <div>{post.comments?.length || 0} comments</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No posts</h3>
                    <p className="mt-1 text-sm text-gray-500">This user hasn't posted anything yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900">User not found</h3>
            <p className="mt-1 text-gray-500">The user you're looking for doesn't exist or has been removed.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserProfilePage;