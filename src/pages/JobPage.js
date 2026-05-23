import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const JobPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    location: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0
  });
  const [savedJobs, setSavedJobs] = useState([]);

  // Job categories for filter dropdown
  const jobCategories = [
    "all",
    "IT & Software", 
    "Agriculture", 
    "Education",
    "Healthcare",
    "Finance",
    "Engineering",
    "Marketing",
    "Sales", 
    "Media",
    "Construction",
    "Hospitality",
    "Manufacturing",
    "Retail",
    "Transportation",
    "Customer Service",
    "Administrative",
    "Legal",
    "Human Resources",
    "Research & Development",
    "Telecommunications",
    "Government",
    "Non-Profit",
    "Other"
  ];

  useEffect(() => {
    fetchJobs();
  }, [filters.category, filters.sortBy, pagination.currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      
      // Set sorting
      if (filters.sortBy === 'newest') params.append('sortBy', 'newest');
      else if (filters.sortBy === 'oldest') params.append('sortBy', 'oldest');
      else if (filters.sortBy === 'deadline') params.append('sortBy', 'deadline');
      
      // Pagination
      params.append('page', pagination.currentPage);
      params.append('limit', 10);
      
      // Fetch jobs from API
      const response = await axios.get(`${API_URL}/jobs?${params.toString()}`);
      
      if (response.data && response.data.success) {
        const jobsData = response.data.data;
        
        setJobs(jobsData.jobs);
        setPagination({
          currentPage: jobsData.currentPage,
          totalPages: jobsData.totalPages,
          totalJobs: jobsData.totalJobs
        });
        
        // Set featured jobs (those with isPromoted flag)
        setFeaturedJobs(jobsData.jobs.filter(job => job.isPromoted));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Reset pagination when searching
    setPagination({
      ...pagination,
      currentPage: 1
    });
    
    fetchJobs();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
    
    // Reset pagination when changing filters
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  const toggleSaveJob = async (jobId) => {
    if (!currentUser) {
      // If not logged in, redirect to login page
      navigate('/login', { state: { from: '/jobs' } });
      return;
    }
    
    try {
      if (savedJobs.includes(jobId)) {
        // Remove from saved jobs
        await axios.delete(`${API_URL}/api/saved-jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      } else {
        // Add to saved jobs
        await axios.post(`${API_URL}/api/saved-jobs/${jobId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setSavedJobs([...savedJobs, jobId]);
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };

  const handleApplyToJob = async (jobId, contactEmail) => {
    if (!currentUser) {
      // If not logged in, redirect to login page
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    // Check if the job belongs to the current user
    if (currentUser.email === contactEmail) {
      // Show error message if trying to apply to own job
      setError("You cannot apply to your own job posting");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setLoading(true);
      // Simple application without resume or cover letter
      const response = await axios.post(`${API_URL}/jobs/${jobId}/apply`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data && response.data.success) {
        // Show success message
        const successMessage = "Application submitted successfully!";
        alert(successMessage);
        
        // Refresh jobs to update the UI
        fetchJobs();
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      setError(error.response?.data?.message || 'Failed to submit application. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        currentPage: newPage
      });
    }
  };

  const JobCard = ({ job, detailed = false }) => {
    const deadline = new Date(job.deadline);
    const isExpired = deadline < new Date();
    
    return (
      <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${detailed ? 'p-0' : 'p-4 mb-4'} ${isExpired ? 'opacity-70' : ''}`}>
        <div className={`flex items-start ${detailed ? 'border-b border-gray-100 p-6' : ''}`}>
          <img 
            src={job.banner || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.title)}&background=random`} 
            alt={`${job.title} banner`} 
            className="w-12 h-12 rounded-lg mr-4 object-cover border border-gray-100"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.title)}&background=random`;
            }}
          />
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg text-blue-700">{job.title}</h3>
                <p className="text-gray-700">{job.employer?.name || 'Company Name'}</p>
              </div>
              <button 
                onClick={() => toggleSaveJob(job._id)}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${savedJobs.includes(job._id) ? 'text-red-500' : 'text-gray-400'}`}
              >
                {savedJobs.includes(job._id) ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="flex flex-wrap mt-2 text-sm">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full mr-2 mb-2">
                {job.location}
              </span>
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full mr-2 mb-2">
                {job.category}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full mr-2 mb-2">
                {job.salary}
              </span>
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full mb-2">
                Posted {formatDate(job.createdAt)}
              </span>
            </div>
            
            {isExpired && (
              <div className="mt-2">
                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-sm">
                  Deadline passed on {deadline.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {detailed && (
          <div className="p-6">
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
            </div>
            
            {job.requirements && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Requirements</h4>
                <p className="text-gray-600 whitespace-pre-line">{job.requirements}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Application Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Deadline:</p>
                  <p className="text-gray-700">{new Date(job.deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Email:</p>
                  <p className="text-gray-700">{job.contactEmail}</p>
                </div>
                {job.contactPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone:</p>
                    <p className="text-gray-700">{job.contactPhone}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              {currentUser && job.contactEmail === currentUser.email ? (
                <Link 
                  to={`/jobs/${job._id}/candidates`}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 mr-3"
                >
                  View Candidates ({job.applicants?.length || 0})
                </Link>
              ) : (
                <button 
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mr-3 ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isExpired && handleApplyToJob(job._id, job.contactEmail)}
                  disabled={isExpired}
                >
                  {isExpired ? 'Deadline Passed' : 'Apply Now'}
                </button>
              )}
              {/* <Link 
                to={`/company/${job.employer?._id}`} 
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                View Company
              </Link> */}
            </div>
          </div>
        )}
        
        {!detailed && (
          <div className="mt-2">
            <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
            <div className="mt-4 flex justify-between items-center">
              <Link 
                to={`/jobs/${job._id}`}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                View Details
              </Link>
              <span className="text-xs text-gray-500 italic">
                Deadline: {new Date(job.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FilterSidebar = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-lg text-gray-800 mb-4">Filter Jobs</h3>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Job Category
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          {jobCategories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Location
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg"
          placeholder="City, State, or Remote"
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Sort By
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-lg"
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="deadline">Deadline (Soonest)</option>
        </select>
      </div>
      
      <button
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        onClick={() => fetchJobs()}
      >
        Apply Filters
      </button>
      
      <button
        className="w-full mt-3 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        onClick={() => {
          setFilters({
            category: 'all',
            location: '',
            sortBy: 'newest'
          });
          setSearchTerm('');
        }}
      >
        Reset Filters
      </button>
      
      {currentUser && (
        <div className="mt-8 border-t pt-6">
          <Link 
            to="/my-applications" 
            className="block text-blue-600 hover:underline mb-3"
          >
            My Applications
          </Link>
          <Link 
            to="/my-cv" 
            className="block text-blue-600 hover:underline mb-3"
          >
            My cv
          </Link>
          {/* {currentUser?.accounttype === 'employer' && (
            <Link 
              to="/posted-jobs" 
              className="block text-blue-600 hover:underline"
            >
              My Posted Jobs
            </Link>
          )} */}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Find Your Dream Job</h1>
          <p className="text-blue-100 text-xl mb-8 max-w-3xl mx-auto">
            Browse opportunities from top companies and take the next step in your career
          </p>
          
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-lg shadow-lg flex flex-col md:flex-row">
            <input
              type="text"
              placeholder="Search jobs, titles, or keywords..."
              className="flex-1 p-3 outline-none rounded-lg text-gray-700"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2 md:mt-0 md:ml-2"
            >
              Search Jobs
            </button>
          </form>
          
          {currentUser?.accounttype === 'employer' && (
            <div className="mt-6">
              <Link 
                to="/create-job" 
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-white"
              >
                + Post a New Job
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading && jobs.length === 0 ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Featured Jobs Section */}
            {featuredJobs.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Opportunities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredJobs.map(job => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>
              </section>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filter Sidebar */}
              <div className="lg:col-span-1">
                <FilterSidebar />
              </div>
              
              {/* Job Listings */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Job Listings <span className="text-gray-500 text-lg">({pagination.totalJobs})</span>
                    </h2>
                    <div>
                      <select 
                        className="p-2 border border-gray-300 rounded-lg"
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="deadline">Deadline (Soonest)</option>
                      </select>
                    </div>
                  </div>
                  
                  {loading && (
                    <div className="flex justify-center p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {!loading && jobs.length > 0 ? (
                    <div className="space-y-6">
                      {jobs.map(job => (
                        <JobCard key={job._id} job={job} detailed={true} />
                      ))}
                    </div>
                  ) : !loading && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No jobs matching your criteria</p>
                      <button 
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        onClick={() => {
                          setFilters({
                            category: 'all',
                            location: '',
                            sortBy: 'newest'
                          });
                          setSearchTerm('');
                          fetchJobs();
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                  
                  {jobs.length > 0 && pagination.totalPages > 1 && (
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
                
                {/* Join Our Platform CTA */}
                {!currentUser && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-3">Join Our Platform</h3>
                    <p className="mb-6">
                      Create an account to apply for jobs, save your favorites, and get personalized recommendations
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <Link 
                        to="/register?type=jobseeker" 
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Find Jobs
                      </Link>
                      <Link 
                        to="/register?type=employer" 
                        className="border border-white text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Post Jobs
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default JobPage;