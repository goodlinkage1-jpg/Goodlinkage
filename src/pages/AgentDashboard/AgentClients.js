import React, { useState, useEffect } from 'react';
import Axiosinstance from './AxiosInstance'; 

export default function AgentClients() {
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch client data from API
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await Axiosinstance.get('/country'); // Update endpoint as needed
        
        const result = response.data;
        
        if (result.success && result.data) {
          setClientData(result.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching client data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);
  
  // Filter and search clients
  const filteredData = clientData.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || client.accounttype === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Sort clients
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Handle string sorting
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    // Handle date sorting
    if (sortConfig.key === 'createdAt') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Function to request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get account type badge color
  const getAccountTypeBadge = (accountType) => {
    const colors = {
      'ngos': 'bg-green-100 text-green-800',
      'business': 'bg-blue-100 text-blue-800',
      'individual': 'bg-purple-100 text-purple-800',
      'government': 'bg-orange-100 text-orange-800'
    };
    
    return colors[accountType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading Client Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading client data</h3>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Clients</h1>
        <div className="text-sm text-gray-500">
          {sortedData.length} of {clientData.length} clients
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Clients</div>
          <div className="text-2xl font-bold text-gray-900">{clientData.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Verified Emails</div>
          <div className="text-2xl font-bold text-green-600">
            {clientData.filter(client => client.isEmailVerified).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">NGO Accounts</div>
          <div className="text-2xl font-bold text-blue-600">
            {clientData.filter(client => client.accounttype === 'ngos').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Countries</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(clientData.map(client => client.country)).size}
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search clients by name, email, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="ngos">NGOs</option>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
              <option value="government">Government</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Client
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('accounttype')}
                >
                  <div className="flex items-center">
                    Account Type
                    {sortConfig.key === 'accounttype' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('country')}
                >
                  <div className="flex items-center">
                    Country
                    {sortConfig.key === 'country' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('createdAt')}
                >
                  <div className="flex items-center">
                    Joined
                    {sortConfig.key === 'createdAt' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {client.avatar ? (
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={client.avatar} 
                            alt={client.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {client.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeBadge(client.accounttype)}`}>
                      {client.accounttype}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${client.isEmailVerified ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className={`text-sm ${client.isEmailVerified ? 'text-green-800' : 'text-red-800'}`}>
                        {client.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => setSelectedClient(client)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">
              {searchTerm || filterType !== 'all' ? 'No clients found matching your criteria.' : 'No clients available.'}
            </div>
          </div>
        )}
      </div>

      {/* Client Details Modal/Panel (if selected) */}
      {selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Client Details</h3>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name:</label>
                  <p className="text-sm text-gray-900">{selectedClient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-900">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone:</label>
                  <p className="text-sm text-gray-900">{selectedClient.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country:</label>
                  <p className="text-sm text-gray-900">{selectedClient.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Type:</label>
                  <p className="text-sm text-gray-900">{selectedClient.accounttype}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Joined:</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedClient.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Status:</label>
                  <p className={`text-sm ${selectedClient.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedClient.isEmailVerified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Contact Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}