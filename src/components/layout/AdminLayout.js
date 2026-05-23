import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';  // Fixed import

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logoutAdmin } = useAdminAuth();  // Add logoutAdmin to destructuring
  // Helper function to determine if a link is active
  const isActiveLink = (path) => {
    return location.pathname.startsWith(path);
  };
  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-gray-800 text-white ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1 rounded hover:bg-gray-700"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            <li>
              <Link 
                to="/admin/dashboard" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActiveLink('/admin/dashboard') ? 'bg-gray-700' : ''
                }`}
              >
               
                {!collapsed && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActiveLink('/admin/users') ? 'bg-gray-700' : ''
                }`}
              >
                
                {!collapsed && <span className="ml-3">User Management</span>}
              </Link>
            </li>
            <li> 
              <Link 
                to="/admin/agents" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActiveLink('/admin/agents') ? 'bg-gray-700' : ''
                }`}
              >
               
                {!collapsed && <span className="ml-3">Agent Management</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/reports/country" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActiveLink('/admin/reports/country') ? 'bg-gray-700' : ''
                }`}
              >
                
                {!collapsed && <span className="ml-3">Country Reports</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/reports/performance" 
                className={`flex items-center p-2 rounded hover:bg-gray-700 ${
                  isActiveLink('/admin/reports/performance') ? 'bg-gray-700' : ''
                }`}
              >
               
                {!collapsed && <span className="ml-3">Agent Performance</span>}
              </Link>
            </li>
            <li>
             
            </li>
          </ul>
        </nav>
        
         <div className="p-4 border-t border-gray-700">
        <button 
          onClick={handleLogout}
          className="flex items-center p-2 rounded hover:bg-gray-700 w-full text-left"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
            <div className="flex items-center space-x-4">
             
              <div className="flex items-center space-x-2">
                
                <span className="font-medium">{adminUser?.email}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}