import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleLeftSidebar, toggleRightSidebar }) => {
  const avatar = require('../../Images/avatar.png');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && showSearch) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left section with brand and mobile menu toggle */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button 
            className="mr-2 text-gray-600 md:hidden"
            onClick={toggleLeftSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Brand */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 truncate">
            <Link to={'/Homepage'}>GoodLinkage</Link>
          </h1>
        </div>
        
        {/* Search - Hidden on mobile, shown on click */}
        <div className={`${showSearch ? 'flex absolute top-full left-0 right-0 bg-white p-2 shadow-md' : 'hidden'} md:relative md:flex md:bg-transparent md:shadow-none md:p-0 md:ml-4`} ref={searchRef}>
          <input
            type="text"
            placeholder="Searching for something?"
            className="bg-gray-100 rounded-full py-2 px-4 w-full md:w-64 focus:outline-none"
          />
        </div>
        
        {/* Navigation Icons - Hidden on small screens */}
        <div className="hidden md:flex space-x-4">
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <Link to={'/Homepage'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <Link to={'/AddNetwork'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <Link to={'/job'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <Link to={'/marketplace'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full" title="Properties Map">
            <Link to={'/properties-map'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6.553 3.276A1 1 0 0021 20.382V9.618a1 1 0 00-1.447-.894L15 11m0 13V11m0 0C11.716 8.333 10.383 7 9 7m6 6v6m0 0l6-3m-6 3l-6-3" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <Link to={'/land-selling'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
          </button>
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
          <Link to={'/my-profile'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </button>
        </div>
        
        {/* Right section with search toggle and profile */}
        <div className="flex items-center">
          {/* Search toggle for mobile */}
          <button
            className="mr-3 text-gray-600 md:hidden"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Network toggle for mobile */}
          <button
            className="mr-3 text-gray-600 md:hidden"
            onClick={toggleRightSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          
          {/* User profile and dropdown */}
          <div className="flex items-center relative" ref={dropdownRef}>
            <div className="mr-2 hidden md:block">
              <p className="text-sm font-medium text-gray-700 truncate max-w-[100px] lg:max-w-[150px]">
                {currentUser?.name || 'User'}
              </p>
            </div>
            <div className="flex items-center cursor-pointer" onClick={toggleDropdown}>
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`}
                alt={currentUser?.name || 'User'} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 md:hidden cursor-pointer">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </span>
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                {/* User Name in Dropdown */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <div className="border-t border-gray-100"></div>
                <Link to="/my-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  My Profile
                </Link>
             
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;