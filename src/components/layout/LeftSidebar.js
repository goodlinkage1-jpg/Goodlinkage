import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LeftSidebar = () => {
  const { currentUser } = useAuth();
  
  return ( 
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <ul className="space-y-2">
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <img 
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`}
            alt={currentUser?.name || 'User'}
            className="rounded-full h-9 w-9 mr-3" 
          />
          <span className="font-semibold">Your Profile</span>
        </li>
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/AddNetwork'}>Add Network</Link></span>
        </li>
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/marketplace'}>Marketplace</Link></span>
        </li>
        {/* Land Selling - Commissioner Only */}
        {currentUser?.accounttype === 'commissioner' && 
        (<li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/land-selling'}>🏠 Sell Land</Link></span>
        </li>)}
        {/* View Properties on Map */}
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-indigo-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6.553 3.276A1 1 0 0021 20.382V9.618a1 1 0 00-1.447-.894L15 11m0 13V11m0 0C11.716 8.333 10.383 7 9 7m6 6v6m0 0l6-3m-6 3l-6-3" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/properties-map'}>🗺️ Properties Map</Link></span>
        </li>
        {currentUser?.accounttype !== 'personal' && 
        (<li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/my-store'}>My Store</Link></span>
        </li>)}
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/job'}>Jobs</Link></span>
        </li>
        {currentUser?.accounttype !== 'personal' && 
        (<li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/create-job'}>Create Job</Link></span>
        </li>)}
        {currentUser?.accounttype === 'ngos' ? (
          <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="whitespace-nowrap"><Link to={'/request-services'}>Request Services</Link></span>
          </li>
        ) : currentUser?.accounttype !== 'personal' && (
          <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="whitespace-nowrap"><Link to={'/request-client'}>Request Client</Link></span>
          </li>
        )}
        
       
        <li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="whitespace-nowrap"><Link to={'/network'}>My Network</Link></span>
        </li>
           { currentUser?.accounttype !== 'ngos' &&
        (<li className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <span className="whitespace-nowrap"><Link to="/groups">Group Chat</Link></span>
          </li>)}
      </ul>
    </div>
  );
};

export default LeftSidebar;