import React from 'react';
import Layout from '../components/layout/Layout';
import CreatePost from '../components/posts/CreatePost';
import PostList from '../components/posts/PostList';
import { usePosts } from '../contexts/PostContext';

const HomePage = () => {
  const { posts, newPostContent, setNewPostContent, handlePostSubmit } = usePosts();

  return (
    <Layout>
      <CreatePost 
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        handlePostSubmit={handlePostSubmit}
      />
      <PostList posts={posts} />
    </Layout>
  );
};

export default HomePage;