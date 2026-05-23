import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../../Config';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Post = ({ post: initialPost }) => {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [comments, setComments] = useState(initialPost.comments || []);
  const [commentUsers, setCommentUsers] = useState({});
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialPost.likes?.length || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  
  const { currentUser } = useAuth();
  
  // Format the post date to a relative time (e.g., "2 hours ago")
  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : 'Just now';
  
  // Fetch initial like status when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/posts/${post._id}/like-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.success) {
          setIsLiked(response.data.data.isLiked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [post._id]);
  
  // Fetch user details for comments if needed
  useEffect(() => {
    const fetchCommentUsers = async () => {
      if (!comments.length) return;
      
      // Collect all user IDs that need to be fetched
      const userIds = comments
        .filter(comment => typeof comment.user === 'string')
        .map(comment => comment.user);
      
      // Remove duplicates
      const uniqueUserIds = [...new Set(userIds)];
      
      if (uniqueUserIds.length === 0) return;
      
      try {
        // Fetch user details for each user ID
        const userDetailsMap = {};
        
        // Fetch in parallel with Promise.all
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const response = await axios.get(`${API_URL}/user/${userId}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
              });
              
              if (response.data.success) {
                userDetailsMap[userId] = response.data.data;
              }
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
            }
          })
        );
        
        setCommentUsers(userDetailsMap);
      } catch (error) {
        console.error('Error fetching comment users:', error);
      }
    };
    
    fetchCommentUsers();
  }, [comments]);
  
  // Toggle comments visibility
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setCommentError('');
    
    try {
      const response = await axios.post(
        `${API_URL}/comment/${post._id}`, 
        { text: commentText },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data.success) {
        // Add the new comment to the comments array
        setComments([...comments, response.data.data]);
        // Clear the input field
        setCommentText('');
      } else {
        setCommentError('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get user details for a comment
  const getCommentUserDetails = (comment) => {
    // If user is already an object with name, use it
    if (typeof comment.user === 'object' && comment.user !== null) {
      return comment.user;
    }
    
    // If user is a string (ID), look up in our fetched users
    if (typeof comment.user === 'string' && commentUsers[comment.user]) {
      return commentUsers[comment.user];
    }
    
    // Default values if user not found
    return { name: 'User', avatar: null };
  };
  
  // Toggle like on post
  const handleToggleLike = async () => {
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/posts/${post._id}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
        setLikeCount(response.data.data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };
  
  // Toggle likes modal and fetch users who liked the post
  const toggleLikesModal = async () => {
    if (likeCount === 0) return;
    
    const newShowLikes = !showLikes;
    setShowLikes(newShowLikes);
    
    if (newShowLikes && likeUsers.length === 0) {
      try {
        const response = await axios.get(`${API_URL}/posts/${post._id}/likes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.success) {
          setLikeUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching like users:', error);
      }
    }
  };

  // Get user ID for profile link
  const getUserId = () => {
    if (typeof post.user === 'object' && post.user !== null) {
      return post.user._id;
    }
    return post.user || '';
  };
    
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center mb-3">
        <Link to={`/profile/${getUserId()}`} className="flex-shrink-0">
          <img 
            src={post.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name || 'User')}&background=random`} 
            alt={post.user?.name || 'User'} 
            className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-blue-100 hover:border-blue-300 transition-colors" 
          />
        </Link>
        <div>
          <Link 
            to={`/profile/${getUserId()}`}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {post.user?.name || 'Anonymous User'}
          </Link>
          <p className="text-gray-500 text-sm">{formattedDate}</p>
        </div>
      </div>
      
      {/* Post content */}
      <p className="mb-4 text-gray-800">{post.content}</p>
      
      {/* Post images (if any) */}
      {post.media && post.media.length > 0 && (
        <div className={`mb-4 grid ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
          {post.media.map((imageUrl, index) => (
            <div key={index} className={`${post.media.length === 1 ? 'col-span-1' : index === 0 && post.media.length === 3 ? 'col-span-2' : ''}`}>
              <img 
                src={imageUrl} 
                alt={`Post image ${index + 1}`} 
                className="rounded-lg w-full h-auto object-cover hover:opacity-95 transition-opacity cursor-pointer" 
                style={{ maxHeight: post.media.length === 1 ? '400px' : '200px' }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Post stats */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <button 
            onClick={toggleLikesModal}
            className="flex items-center hover:text-blue-500 transition-colors"
            disabled={likeCount === 0}
          >
            <div className={`${isLiked ? 'bg-blue-500' : 'bg-gray-300'} text-white rounded-full p-1 mr-1 transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            {likeCount}
          </button>
        </div>
        <div>
          <button 
            onClick={toggleComments}
            className="hover:text-blue-500 transition-colors"
          >
            {comments.length || 0} comments
          </button>
        </div>
      </div>
      
      {/* Post actions */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-around">
          <button 
            className={`flex items-center ${isLiked ? 'text-blue-500' : 'text-gray-600'} hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors`}
            onClick={handleToggleLike}
            disabled={isLikeLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {isLiked ? 'Liked' : 'Like'}
          </button>
          <button 
            className="flex items-center text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            onClick={toggleComments}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment
          </button>
          <button className="flex items-center text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
      
      {/* Likes Modal */}
      {showLikes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">People who liked this post</h3>
              <button 
                onClick={toggleLikesModal}
                className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {likeUsers.length > 0 ? (
                <div className="space-y-4">
                  {likeUsers.map(user => (
                    <div key={user._id} className="flex items-center">
                      <Link to={`/profile/${user._id}`} className="flex items-center flex-grow hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                          alt={user.name} 
                          className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-blue-100" 
                        />
                        <div>
                          <p className="font-medium text-blue-600">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t pt-4">
          {/* Comment form */}
          <form onSubmit={handleCommentSubmit} className="mb-4 flex">
            <input
              type="text"
              className="flex-grow border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>
          
          {commentError && (
            <div className="text-red-500 text-sm mb-3">{commentError}</div>
          )}
          
          {/* Comments list */}
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments.map((comment, index) => {
                const userDetails = getCommentUserDetails(comment);
                const userId = typeof comment.user === 'object' && comment.user !== null 
                  ? comment.user._id 
                  : typeof comment.user === 'string' ? comment.user : '';
                
                return (
                  <div key={comment._id || index} className="flex space-x-2">
                    <Link to={`/profile/${userId}`} className="flex-shrink-0">
                      <img
                        src={userDetails.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetails.name || 'User')}&background=random`}
                        alt={userDetails.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover border border-blue-100"
                      />
                    </Link>
                    <div className="flex-grow">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors">
                        <Link to={`/profile/${userId}`} className="font-semibold text-sm text-blue-600 hover:underline">
                          {userDetails.name || 'User'}
                        </Link>
                        <p className="text-sm text-gray-800">{comment.text}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {comment.createdAt 
                          ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                          : 'Just now'
                        }
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center text-sm py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;