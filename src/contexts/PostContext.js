import React, { createContext, useState, useContext } from 'react';
import { initialPosts as mockPosts } from '../data/mockData';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState(mockPosts);
  const [newPostContent, setNewPostContent] = useState('');

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (newPostContent.trim()) {
      const newPost = {
        id: posts.length + 1,
        user: 'You',
        avatar: '/api/placeholder/40/40',
        time: 'Just now',
        content: newPostContent,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
    }
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        setPosts,
        newPostContent,
        setNewPostContent,
        handlePostSubmit
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => useContext(PostContext);

export default PostContext;