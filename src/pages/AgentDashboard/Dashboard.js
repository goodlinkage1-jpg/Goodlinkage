import React, { useState, useEffect } from 'react';
import Axiosinstance from './AxiosInstance'; 
export default function Dashboard() {
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [sortConfig, setSortConfig] = useState({
    key: 'total',
    direction: 'desc'
  });

  // Fetch country data from API
  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        setLoading(true);
        const response = await Axiosinstance.get('/country');
        
        // Axios automatically throws for HTTP error status codes (4xx, 5xx)
        // So we don't need to check response.ok
        
        const result = response.data; // Axios already parses JSON
        
        if (result.success && result.data) {
          // Transform API data to include additional calculated fields
          const transformedData = result.data.map(country => ({
            ...country,
            country: country.country || 'Unknown', // Handle empty country names
            satisfaction: Math.floor(Math.random() * 20) + 80, // Mock satisfaction (80-100%)
            responseTime: `${(Math.random() * 2 + 3).toFixed(1)} min`, // Mock response time
            resolveTime: `${(Math.random() * 1 + 0.5).toFixed(1)} hours`, // Mock resolve time
            growth: `${Math.random() > 0.8 ? '-' : '+'}${Math.floor(Math.random() * 20 + 1)}%`, // Mock growth
            tickets: Math.floor(country.total * (Math.random() * 50 + 20)) // Estimate tickets based on total users
          }));
          
          setCountryData(transformedData);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching country data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, []);
  
  // Sort countries
  const sortedData = [...countryData].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Handle string sorting for country names
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    // Handle percentage strings for growth
    if (sortConfig.key === 'growth') {
      aVal = parseInt(aVal.replace(/[+%-]/g, ''));
      bVal = parseInt(bVal.replace(/[+%-]/g, ''));
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
  
  // Mock monthly growth data for selected country
  const getCountryDetails = (country) => {
    const monthlyData = [
      { month: 'Jan', users: 1, tickets: 15, satisfaction: 86 },
      { month: 'Feb', users: 1, tickets: 18, satisfaction: 87 },
      { month: 'Mar', users: 2, tickets: 25, satisfaction: 88 },
      { month: 'Apr', users: 3, tickets: 32, satisfaction: 88 },
      { month: 'May', users: 4, tickets: 40, satisfaction: 89 },
      { month: 'Jun', users: 6, tickets: 55, satisfaction: 90 },
    ];
    
    return {
      data: monthlyData,
      tickets: {
        categories: ['Technical', 'Billing', 'Account', 'Product', 'Other'],
        distribution: [45, 25, 15, 10, 5]
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading  Dashboard Pannel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading country reports</h3>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Country Reports</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-md ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'border'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-md ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'border'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1 rounded-md ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'border'}`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Countries</div>
          <div className="text-2xl font-bold text-gray-900">{countryData.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="text-2xl font-bold text-blue-600">
            {countryData.length}
          </div> 
        </div>
       
      </div>
      
      
      
      {/* Country Details (if selected) */}
      
    </div>
  );
}