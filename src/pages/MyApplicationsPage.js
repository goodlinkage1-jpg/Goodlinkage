import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const MyApplicationsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0
  });

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Applications' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Reviewed', label: 'Reviewed' },
    { value: 'Shortlisted', label: 'Shortlisted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Hired', label: 'Hired' }
  ];
  
  // Status badge colors
  const statusColors = {
    Pending: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    Reviewed: { bg: 'bg-blue-50', text: 'text-blue-700' },
    Shortlisted: { bg: 'bg-green-50', text: 'text-green-700' },
    Rejected: { bg: 'bg-red-50', text: 'text-red-700' },
    Hired: { bg: 'bg-purple-50', text: 'text-purple-700' }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login', { state: { from: '/my-applications' } });
      return;
    }
    
    fetchApplications();
  }, [currentUser, filters.status, filters.page]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      
      // Fetch applications from API
      const response = await axios.get(`${API_URL}/my-applications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        
        setApplications(data.applications);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalApplications: data.totalApplications
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load your applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setFilters({
      ...filters,
      status,
      page: 1 // Reset to first page when changing filters
    });
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters({
        ...filters,
        page: newPage
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const ApplicationCard = ({ application }) => {
    const { job, application: appDetails } = application;
    const statusStyle = statusColors[appDetails.status] || { bg: 'bg-gray-50', text: 'text-gray-700' };
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden p-6 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <Link to={`/jobs/${job.id}`} className="text-xl font-semibold text-blue-700 hover:underline">
              {job.title}
            </Link>
            <p className="text-gray-700 mt-1">{job.company}</p>
            <div className="flex flex-wrap mt-3 text-sm">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full mr-2 mb-2">
                {job.location}
              </span>
              <span className={`${statusStyle.bg} ${statusStyle.text} px-2 py-1 rounded-full mr-2 mb-2`}>
                Status: {appDetails.status}
              </span>
              <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded-full mb-2">
                Applied: {formatDate(appDetails.appliedAt)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full ${job.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              Job Status: {job.status}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Deadline: {formatDate(job.deadline)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline mr-6">
            View Job Details
          </Link>
          {appDetails.status === 'Shortlisted' && (
            <Link to={`/jobs/${job.id}/interview`} className="text-green-600 hover:underline">
              Schedule Interview
            </Link>
          )}
          {appDetails.status === 'Rejected' && (
            <Link to="/jobs" className="text-blue-600 hover:underline">
              Browse More Jobs
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">My Applications</h1>
          <p className="text-blue-100">
            Track and manage your job applications
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Filter Applications</h3>
              
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      filters.status === option.value 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => handleFilterChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
                <Link to="/jobs" className="block text-blue-600 hover:underline mb-2">
                  Browse Jobs
                </Link>
                <Link to="/saved-jobs" className="block text-blue-600 hover:underline mb-2">
                  Saved Jobs
                </Link>
                <Link to="/profile" className="block text-blue-600 hover:underline">
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Applications <span className="text-gray-500 text-lg">({pagination.totalApplications})</span>
                </h2>
                {applications.length > 0 && (
                  <div className="text-gray-500 text-sm">
                    Showing {applications.length} of {pagination.totalApplications} applications
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-6">
                  {applications.map((application, index) => (
                    <ApplicationCard key={index} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 text-5xl mb-4">📝</div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No applications yet</h3>
                  <p className="text-gray-500 mb-6">
                    You haven't applied to any jobs yet. Start browsing and applying to find your next opportunity!
                  </p>
                  <Link 
                    to="/jobs" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </div>
              )}
              
              {/* Pagination */}
              {applications.length > 0 && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center">
                    <button 
                      className="px-3 py-1 border border-gray-300 rounded-l-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => changePage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show current page, first, last, and pages close to current
                        return (
                          page === 1 || 
                          page === pagination.totalPages || 
                          Math.abs(page - pagination.currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis when there are gaps
                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-3 py-1 border-t border-b border-gray-300 text-gray-400">
                                ...
                              </span>
                            )}
                            <button 
                              className={`px-3 py-1 border-t border-b border-gray-300 ${
                                pagination.currentPage === page 
                                  ? 'bg-blue-50 text-blue-600' 
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              onClick={() => changePage(page)}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    
                    <button 
                      className="px-3 py-1 border border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => changePage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
            
            {/* Application Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Application Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Perfect Your Resume</h4>
                  <p className="text-gray-600 text-sm">
                    Tailor your resume for each job application by highlighting relevant experiences and skills.
                  </p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Follow Up</h4>
                  <p className="text-gray-600 text-sm">
                    Send a follow-up email one week after applying if you haven't heard back.
                  </p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Prepare for Interviews</h4>
                  <p className="text-gray-600 text-sm">
                    Research the company thoroughly and practice common interview questions.
                  </p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Stay Organized</h4>
                  <p className="text-gray-600 text-sm">
                    Keep track of all your applications, follow-ups, and interview schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyApplicationsPage;