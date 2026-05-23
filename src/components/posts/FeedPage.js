import React from 'react';
import PostList from './PostList';
import { useAuth } from '../../contexts/AuthContext';

const FeedPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar - User Profile */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
              <div className="flex flex-col items-center">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`}
                  alt={currentUser?.name || 'User'}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <h2 className="text-xl font-semibold">{currentUser?.name || 'User'}</h2>
                <p className="text-gray-500 mb-4">{currentUser?.email || ''}</p>
                <div className="w-full border-t border-gray-200 my-4"></div>
                <div className="flex justify-between w-full text-sm">
                  <div className="text-center">
                    <div className="font-semibold">Posts</div>
                    <div className="text-gray-500">0</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Followers</div>
                    <div className="text-gray-500">0</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Following</div>
                    <div className="text-gray-500">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - Posts */}
          <div className="md:w-2/4">
            <PostList />
          </div>
          
          {/* Right Sidebar - Suggestions */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
              <h3 className="font-semibold mb-4">Suggested For You</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src="/api/placeholder/40/40" alt="User" className="w-10 h-10 rounded-full mr-2" />
                    <div>
                      <div className="font-medium">Jane Smith</div>
                      <div className="text-xs text-gray-500">Suggested for you</div>
                    </div>
                  </div>
                  <button className="text-blue-500 text-sm font-medium">Follow</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src="/api/placeholder/40/40" alt="User" className="w-10 h-10 rounded-full mr-2" />
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-xs text-gray-500">Suggested for you</div>
                    </div>
                  </div>
                  <button className="text-blue-500 text-sm font-medium">Follow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;