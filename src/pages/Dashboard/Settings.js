import React, { useState } from 'react';

export default function Settings() {
  // Mock account settings state
  const [accountSettings, setAccountSettings] = useState({
    email: 'admin@example.com',
    name: 'Admin User',
    sendNotifications: true,
    emailReports: 'weekly',
    theme: 'light',
    language: 'en',
    timezone: 'UTC-5 (Eastern Time)',
    sessionTimeout: 30
  });
  
  // Mock system settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    maxAgentsPerDepartment: 10,
    autoAssignTickets: true,
    ticketPrioritization: 'balanced',
    defaultResponseTemplate: 'standard',
    maxFileSize: 10, // in MB
    allowedFileTypes: 'pdf,doc,docx,jpg,png',
    backupFrequency: 'daily',
    logRetention: 30 // days
  });
  
  // Password change state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  // Form submission handlers
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the updated settings to an API
    alert('Account settings updated!');
  };
  
  const handleSystemSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the updated settings to an API
    alert('System settings updated!');
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }
    // In a real app, this would validate the current password and update it
    alert('Password changed successfully!');
    setPasswords({ current: '', new: '', confirm: '' });
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Account Settings</h2>
        </div>
        <form onSubmit={handleAccountSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.name}
                onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.email}
                onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.language}
                onChange={(e) => setAccountSettings({...accountSettings, language: e.target.value})}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.timezone}
                onChange={(e) => setAccountSettings({...accountSettings, timezone: e.target.value})}
              >
                <option value="UTC-12">UTC-12 (Baker Island)</option>
                <option value="UTC-8">UTC-8 (Pacific Time)</option>
                <option value="UTC-5">UTC-5 (Eastern Time)</option>
                <option value="UTC+0">UTC+0 (London)</option>
                <option value="UTC+1">UTC+1 (Paris)</option>
                <option value="UTC+8">UTC+8 (Beijing)</option>
                <option value="UTC+9">UTC+9 (Tokyo)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.theme}
                onChange={(e) => setAccountSettings({...accountSettings, theme: e.target.value})}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input 
                type="number" 
                min="5"
                max="120"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.sessionTimeout}
                onChange={(e) => setAccountSettings({...accountSettings, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Reports</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={accountSettings.emailReports}
                onChange={(e) => setAccountSettings({...accountSettings, emailReports: e.target.value})}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="notifications"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={accountSettings.sendNotifications}
                onChange={(e) => setAccountSettings({...accountSettings, sendNotifications: e.target.checked})}
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                Receive Browser Notifications
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Account Settings
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                required
              />
            </div>
            
            <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">System Settings</h2>
        </div>
        <form onSubmit={handleSystemSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="maintenanceMode"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
              />
              <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                Maintenance Mode
              </label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="registrationOpen"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={systemSettings.registrationOpen}
                onChange={(e) => setSystemSettings({...systemSettings, registrationOpen: e.target.checked})}
              />
              <label htmlFor="registrationOpen" className="ml-2 block text-sm text-gray-900">
                Open Registration
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Agents Per Department</label>
              <input 
                type="number" 
                min="1"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.maxAgentsPerDepartment}
                onChange={(e) => setSystemSettings({...systemSettings, maxAgentsPerDepartment: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="autoAssignTickets"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={systemSettings.autoAssignTickets}
                onChange={(e) => setSystemSettings({...systemSettings, autoAssignTickets: e.target.checked})}
              />
              <label htmlFor="autoAssignTickets" className="ml-2 block text-sm text-gray-900">
                Auto-assign Tickets
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Prioritization</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.ticketPrioritization}
                onChange={(e) => setSystemSettings({...systemSettings, ticketPrioritization: e.target.value})}
              >
                <option value="balanced">Balanced</option>
                <option value="urgency">Prioritize by Urgency</option>
                <option value="customer">Prioritize by Customer Value</option>
                <option value="age">Prioritize by Age</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Response Template</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.defaultResponseTemplate}
                onChange={(e) => setSystemSettings({...systemSettings, defaultResponseTemplate: e.target.value})}
              >
                <option value="standard">Standard</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
              <input 
                type="number" 
                min="1"
                max="100"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.maxFileSize}
                onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.allowedFileTypes}
                onChange={(e) => setSystemSettings({...systemSettings, allowedFileTypes: e.target.value})}
                placeholder="Comma separated extensions (pdf,doc,jpg,etc)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.backupFrequency}
                onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Retention Period (days)</label>
              <input 
                type="number" 
                min="1"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemSettings.logRetention}
                onChange={(e) => setSystemSettings({...systemSettings, logRetention: parseInt(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}