import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Axiosinstance from './AxiosInstance';

export default function AgentManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [error, setError] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    accountType: 'all',
    country: 'all', 
    status: 'all',
  });

  // Countries list
  const [countries] = useState([
    'Rwanda',
    'Uganda',
    'Kenya',
    'Tanzania',
    'Burundi',
    'Democratic Republic of the Congo',
    'South Sudan',
    'Ethiopia',
    'Somalia',
    'Djibouti'
  ]);

  // Fetch all agents
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await Axiosinstance.get('/agent');
      if (response.data.success) {
        setUsers(response.data.data.agents);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle adding new user
  const handleAddUser = async (userData) => {
    try {
      const response = await Axiosinstance.post('/agent', userData);
      if (response.data.success) {
        fetchUsers(); // Refresh the list
        setIsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add user');
    }
  };

  // Handle updating user
  const handleUpdateUser = async (id, userData) => {
    try {
      const response = await Axiosinstance.put(`/agent/${id}`, userData);
      if (response.data.success) {
        fetchUsers(); // Refresh the list
        setIsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle deleting user
  const handleDeleteUser = async (id) => {
    try {
      const response = await Axiosinstance.delete(`/agent/${id}`);
      if (response.data.success) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle form submission
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    const userData = {
      name: selectedUser.name,
      email: selectedUser.email,
      accountType: selectedUser.accountType, // Fixed: was accounttype
      country: selectedUser.country,
      phone: selectedUser.phone
    };

    if (modalMode === 'add') {
      await handleAddUser(userData);
    } else if (modalMode === 'edit') {
      await handleUpdateUser(selectedUser._id, userData);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await handleUpdateUser(userId, { ...user, status: newStatus });
    }
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccountType = filters.accountType === 'all' || 
                              user.accountType?.toLowerCase() === filters.accountType.toLowerCase();
    const matchesCountry = filters.country === 'all' || user.country === filters.country;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    
    return matchesSearch && matchesAccountType && matchesCountry && matchesStatus;
  });

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setIsModalOpen(true);
  };

  // Handle add new user
  const handleAddNewUser = () => {
    setSelectedUser({
      name: '',
      email: '',
      accountType: 'customer',
      country: '',
      phone: '',
      status: 'active'
    });
    setModalMode('add');
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button 
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}
      
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
        <button
          onClick={handleAddNewUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span className="material-icons">add</span>
          <span>Add User</span>
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-gray-400">search</span>
              </span>
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select 
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.accountType}
              onChange={(e) => setFilters({...filters, accountType: e.target.value})}
            >
              <option value="all">All Types</option>
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            
            <select 
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.country}
              onChange={(e) => setFilters({...filters, country: e.target.value})}
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            
            <select 
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Users Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex-shrink-0 mr-3">
                        <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{user.accountType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.country}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUserSelect(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setModalMode('edit');
                        setIsModalOpen(true);
                      }}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className='text-red-600 hover:text-red-900'
                    >
                      Deactivate 
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No users found matching your criteria
            </div>
          )}
        </div>
      )}
      
      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium">
                {modalMode === 'view' ? 'User Details' : 
                 modalMode === 'edit' ? 'Edit User' : 'Add New User'}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmitUser}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser?.name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    readOnly={modalMode === 'view'}
                    required={modalMode !== 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser?.email || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    readOnly={modalMode === 'view'}
                    required={modalMode !== 'view'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser?.accountType || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, accountType: e.target.value})}
                    disabled={modalMode === 'view'}
                    required={modalMode !== 'view'}
                  >
                    <option value="">Select account type</option>
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser?.country || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, country: e.target.value})}
                    disabled={modalMode === 'view'}
                    required={modalMode !== 'view'}
                  >
                    <option value="">Select a country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser?.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    readOnly={modalMode === 'view'}
                    required={modalMode !== 'view'}
                  />
                </div>
                
                {modalMode !== 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedUser?.status || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})}
                      disabled={modalMode === 'view'}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                {modalMode === 'view' ? (
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {modalMode === 'add' ? 'Add User' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
          <span className="font-medium">{filteredUsers.length}</span> results
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border rounded-md disabled:opacity-50" disabled>Previous</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md">1</button>
          <button className="px-3 py-1 border rounded-md disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}