import React, { useState } from 'react';

export default function AgentPerformance() {
  // Mock agent performance data
  const agentPerformanceData = [
    { 
      id: 1,
      name: 'Emma Wilson', 
      department: 'Sales Support',
      tickets: 145,
      resolved: 142,
      satisfaction: 98,
      responseTime: '4.2 min',
      resolveTime: '1.1 hours',
      onlineTime: '38.5 hours',
      availability: 96
    },
    { 
      id: 2,
      name: 'Michael Brown', 
      department: 'Technical Support',
      tickets: 132,
      resolved: 128,
      satisfaction: 95,
      responseTime: '5.1 min',
      resolveTime: '1.4 hours',
      onlineTime: '37.2 hours',
      availability: 93
    },
    { 
      id: 3,
      name: 'Sophia Garcia', 
      department: 'Customer Service',
      tickets: 128,
      resolved: 120,
      satisfaction: 92,
      responseTime: '3.8 min',
      resolveTime: '1.2 hours',
      onlineTime: '39.1 hours',
      availability: 98
    },
    { 
      id: 4,
      name: 'David Kim', 
      department: 'Technical Support',
      tickets: 112,
      resolved: 100,
      satisfaction: 89,
      responseTime: '6.5 min',
      resolveTime: '1.7 hours',
      onlineTime: '35.8 hours',
      availability: 90
    },
    { 
      id: 5,
      name: 'Olivia Chen', 
      department: 'Sales Support',
      tickets: 138,
      resolved: 135,
      satisfaction: 96,
      responseTime: '3.5 min',
      resolveTime: '0.9 hours',
      onlineTime: '38.9 hours',
      availability: 97
    },
    { 
      id: 6,
      name: 'James Rodriguez', 
      department: 'Technical Support',
      tickets: 125,
      resolved: 122,
      satisfaction: 94,
      responseTime: '4.8 min',
      resolveTime: '1.3 hours',
      onlineTime: '37.5 hours',
      availability: 94
    },
    { 
      id: 7,
      name: 'Sarah Johnson', 
      department: 'Customer Service',
      tickets: 118,
      resolved: 115,
      satisfaction: 93,
      responseTime: '4.1 min',
      resolveTime: '1.0 hours',
      onlineTime: '38.2 hours',
      availability: 96
    },
    { 
      id: 8,
      name: 'Robert Lee', 
      department: 'Sales Support',
      tickets: 110,
      resolved: 105,
      satisfaction: 91,
      responseTime: '5.2 min',
      resolveTime: '1.5 hours',
      onlineTime: '36.8 hours',
      availability: 92
    },
  ];
  
  // Mock weekly data for individual agent performance
  const weeklyData = [
    { day: 'Mon', tickets: 32, resolved: 30, satisfaction: 96 },
    { day: 'Tue', day_num: 2, tickets: 28, resolved: 27, satisfaction: 97 },
    { day: 'Wed', day_num: 3, tickets: 35, resolved: 33, satisfaction: 95 },
    { day: 'Thu', day_num: 4, tickets: 30, resolved: 29, satisfaction: 98 },
    { day: 'Fri', day_num: 5, tickets: 20, resolved: 19, satisfaction: 99 },
  ];
  
  // Time period filter
  const [timeRange, setTimeRange] = useState('week');
  
  // Department filter
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const departments = [...new Set(agentPerformanceData.map(agent => agent.department))];
  
  // Performance sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'satisfaction',
    direction: 'desc'
  });
  
  // Selected agent for details view
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Sort agents based on current config
  const sortedAgents = [...agentPerformanceData]
    .filter(agent => departmentFilter === 'all' || agent.department === departmentFilter)
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  
  // Request a sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get agent details 
  const getAgentDetails = (agentId) => {
    return {
      weekly: weeklyData,
      // Mock data for ticket types
      ticketTypes: [
        { type: 'Account Issue', count: 45, percentage: 35 },
        { type: 'Technical Problem', count: 38, percentage: 29 },
        { type: 'Billing Question', count: 25, percentage: 19 },
        { type: 'Feature Request', count: 15, percentage: 12 },
        { type: 'Other', count: 7, percentage: 5 }
      ]
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Agent Performance</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time Period Filter */}
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
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 rounded-md ${timeRange === 'quarter' ? 'bg-blue-600 text-white' : 'border'}`}
            >
              Quarter
            </button>
          </div>
          
          {/* Department Filter */}
          <select
            className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Satisfaction</p>
              <p className="text-2xl font-bold">
                {Math.round(sortedAgents.reduce((sum, agent) => sum + agent.satisfaction, 0) / sortedAgents.length)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-icons text-green-600">sentiment_satisfied_alt</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-bold">4.5 min</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="material-icons text-blue-600">timer</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold">
                {Math.round((sortedAgents.reduce((sum, agent) => sum + agent.resolved, 0) / 
                  sortedAgents.reduce((sum, agent) => sum + agent.tickets, 0)) * 100)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="material-icons text-yellow-600">assignment_turned_in</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Availability</p>
              <p className="text-2xl font-bold">
                {Math.round(sortedAgents.reduce((sum, agent) => sum + agent.availability, 0) / sortedAgents.length)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="material-icons text-purple-600">event_available</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Ranking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('tickets')}
              >
                <div className="flex items-center">
                  Tickets
                  {sortConfig.key === 'tickets' && (
                    <span className="material-icons ml-1 text-xs">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('satisfaction')}
              >
                <div className="flex items-center">
                  Satisfaction
                  {sortConfig.key === 'satisfaction' && (
                    <span className="material-icons ml-1 text-xs">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('responseTime')}
              >
                <div className="flex items-center">
                  Avg Response
                  {sortConfig.key === 'responseTime' && (
                    <span className="material-icons ml-1 text-xs">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('availability')}
              >
                <div className="flex items-center">
                  Availability
                  {sortConfig.key === 'availability' && (
                    <span className="material-icons ml-1 text-xs">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAgents.map((agent, index) => (
              <tr key={agent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className={`h-full rounded-full ${
                          agent.availability >= 95 ? 'bg-green-500' : 
                          agent.availability >= 85 ? 'bg-blue-500' : 
                          agent.availability >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${agent.availability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{agent.availability}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {agent.id === selectedAgent ? 'Hide Details' : 'Show Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Agent Details (if selected) */}
      {selectedAgent && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {agentPerformanceData.find(a => a.id === selectedAgent)?.name} - Performance Details
            </h2>
            <button 
              onClick={() => setSelectedAgent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Performance Chart (Placeholder) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Weekly Performance</h3>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center text-gray-500">
                Weekly performance chart would go here (requires chart library)
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getAgentDetails(selectedAgent).weekly.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.day}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.tickets}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.resolved}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.satisfaction}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Ticket Types Distribution (Placeholder) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ticket Types Handled</h3>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center text-gray-500">
                Ticket types chart would go here (requires chart library)
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getAgentDetails(selectedAgent).ticketTypes.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}