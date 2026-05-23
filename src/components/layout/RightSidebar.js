import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../Config';

const RightSidebar = () => {
  const { currentUser } = useAuth();
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [followData, setFollowData] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]); 

  const fetchFollowData = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token found');
        setPeopleLoading(false);
        return;
      }
      
      // Make the API request
      const response = await axios.get(`${API_URL}/people`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Responses:', response.data);
      
      // Process the response data
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setFollowData(response.data.data);
      } else if (Array.isArray(response.data)) {
        setFollowData(response.data);
      } else {
        console.error('Unexpected data format:', response.data);
        setFollowData([]);
      }
      
      setPeopleLoading(false);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      setPeopleLoading(false);
    }
  };

  const fetchLatestJobs = async () => {
    try {
      setJobsLoading(true);
      
      // Get token (if available) to automatically exclude user's own jobs
      const token = localStorage.getItem('accessToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Make API request
      const response = await axios.get(`${API_URL}/sidebar/latest?limit=3`, { headers });
      
      if (response.data && response.data.success) {
        setLatestJobs(response.data.data);
      } else {
        setLatestJobs([]);
      }
    } catch (error) {
      console.error('Error fetching latest jobs:', error);
      setLatestJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowData();
    fetchLatestJobs();
  }, []);

  const handleConnect = async (personId) => {
    try {
      setPeopleLoading(true);
  
      const token = localStorage.getItem('accessToken');
        
      if (!token) {
        console.error('No token found');
        setPeopleLoading(false);
        return;
      }
        
      const response = await axios.post(
        `${API_URL}/follow/${personId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
        
      console.log('Follow response:', response.data);
      
      // Refresh the list after successful connection
      await fetchFollowData();
      
    } catch (error) {
      console.error('Error connecting with person:', error);
      if (error.response) {
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } finally {
      setPeopleLoading(false);
    }
  };

  // Format date for display
  const formatPostedDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const daysAgo = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(daysAgo / 30)} month${Math.floor(daysAgo / 30) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="h-full">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">People You May Know</h2>
        
        {peopleLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : followData.length > 0 ? (
          <div className="space-y-4">
            {followData.slice(0, 3).map(person => (
              <div key={person._id} className="flex items-start">
                <img 
                  src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'User')}&background=random`}
                  alt={person.name || 'User'} 
                  className="w-10 h-10 rounded-full mr-3 object-cover" 
                />
                <div className="flex-grow">
                 <Link to={`/profile/${person._id}`} className="text-blue-500 hover:text-blue-700">
                    {person.name}
                </Link>
                  <p className="text-gray-500 text-sm">
                    {person.accounttype && person.accounttype.charAt(0).toUpperCase() + person.accounttype.slice(1)}
                  </p>
                  <button 
                    className="mt-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-blue-200 transition duration-200"
                    onClick={() => handleConnect(person._id)}
                    disabled={peopleLoading}
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
            
            {followData.length > 3 && (
              <button className="w-full text-blue-600 font-semibold hover:bg-blue-50 py-2 rounded-md transition duration-200">
                See more suggestions
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-2">No suggestions available</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Latest Jobs</h2>
        
        {jobsLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : latestJobs.length > 0 ? (
          <div className="space-y-4">
            {latestJobs.map(job => (
              <div key={job._id} className="pb-3 border-b border-gray-200">
                <Link to={`/jobs/${job._id}`} className="hover:text-blue-600">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                </Link>
                <p className="text-gray-600 text-sm truncate">{job.company} • {job.jobType || 'Full-time'}</p>
                <p className="text-gray-500 text-sm">Posted {formatPostedDate(job.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-2">No jobs available</p>
        )}
        
        <Link to="/job" className="mt-4 block w-full text-center text-blue-600 font-semibold hover:bg-blue-50 py-2 rounded-md transition duration-200">
          See all jobs
        </Link>
      </div>
    </div>
  );
};
 
export default RightSidebar;