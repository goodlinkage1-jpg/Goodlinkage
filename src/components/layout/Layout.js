import React, { useState } from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Chatbot from './Chatbot';

const Layout = ({ children }) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  
  // Toggle mobile sidebars
  const toggleLeftSidebar = () => setShowLeftSidebar(!showLeftSidebar);
  const toggleRightSidebar = () => setShowRightSidebar(!showRightSidebar);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header toggleLeftSidebar={toggleLeftSidebar} toggleRightSidebar={toggleRightSidebar} />
      
      <div className="container mx-auto pt-20 pb-10 px-4 flex flex-col md:grid md:grid-cols-12 gap-4">
        {/* Mobile Left Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${
            showLeftSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={toggleLeftSidebar}
        ></div>
        
        {/* Left Sidebar - Hidden on mobile, shown with toggle */}
        <div 
          className={`fixed top-0 left-0 h-full w-64 bg-white z-30 md:static md:h-auto md:w-auto md:z-0 md:col-span-3 transform transition-transform duration-300 md:transform-none ${
            showLeftSidebar ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          <div className="pt-20 md:pt-0">
            <button 
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 md:hidden"
              onClick={toggleLeftSidebar}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <LeftSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-12 lg:col-span-6 order-1 md:order-2">
          {children}
        </div>

        {/* Mobile Right Sidebar Overlay */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${
            showRightSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={toggleRightSidebar}
        ></div>
        
        {/* Right Sidebar - Hidden on mobile, shown with toggle */}
        <div 
          className={`fixed top-0 right-0 h-full w-64 bg-white z-30 lg:static lg:h-auto lg:w-auto lg:z-0 lg:col-span-3 transform transition-transform duration-300 lg:transform-none ${
            showRightSidebar ? 'translate-x-0' : 'translate-x-full'
          } lg:translate-x-0 order-3`}
        >
          <div className="pt-20 lg:pt-0">
            <button 
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-200 lg:hidden"
              onClick={toggleRightSidebar}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RightSidebar />
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-blue-600 flex flex-col items-center"
          onClick={toggleLeftSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs">Menu</span>
        </button>
        
        <button className="p-2 text-gray-600 hover:text-blue-600 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Home</span>
        </button>
        
        <button className="p-2 text-gray-600 hover:text-blue-600 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Jobs</span>
        </button>
        
        <button 
          className="p-2 text-gray-600 hover:text-blue-600 flex flex-col items-center"
          onClick={toggleRightSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs">Network</span>
        </button>
      </div>
      
      {/* Chatbot Component - adjust position for mobile */}
      <div className="fixed bottom-16 md:bottom-4 right-4 z-10">
        <Chatbot />
      </div>
    </div>
  );
};

export default Layout;