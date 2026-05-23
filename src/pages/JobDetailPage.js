import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import RightSidebar from '../components/layout/RightSidebar';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  useEffect(() => {
    fetchJobDetails();
    checkIfJobIsSaved();
  }, [jobId]);
  
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/jobs/${jobId}`);
      
      if (response.data && response.data.success) {
        setJob(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfJobIsSaved = async () => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/saved-jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data && response.data.success) {
        const savedJobIds = response.data.data.map(job => job._id);
        setIsSaved(savedJobIds.includes(jobId));
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };
  
  const toggleSaveJob = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    try {
      if (isSaved) {
        // Remove from saved jobs
        await axios.delete(`${API_URL}/api/saved-jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setIsSaved(false);
      } else {
        // Add to saved jobs
        await axios.post(`${API_URL}/api/saved-jobs/${jobId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData({
      ...applicationData,
      [name]: value
    });
  };
  
  const handleApplyToJob = async (e) => {
    if (e) e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    // Check if the job belongs to the current user
    if (job && currentUser.email === job.contactEmail) {
      setError("You cannot apply to your own job posting");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setIsApplying(true);
      
      const response = await axios.post(
        `${API_URL}/jobs/${jobId}/apply`,
        { coverLetter: applicationData.coverLetter },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // Show success message and refresh job details
        alert("Application submitted successfully!");
        setShowApplicationForm(false);
        fetchJobDetails();
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      setError(error.response?.data?.message || 'Failed to submit application. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsApplying(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const calculateTimeAgo = (dateString) => {
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
      return formatDate(dateString);
    }
  };
  
  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error && !job) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">{error}</p>
            <div className="mt-4">
              <Link to="/jobs" className="text-blue-600 hover:underline">
                Back to Job Listings
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!job) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-yellow-100 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
            <p className="font-medium">Job not found</p>
            <div className="mt-4">
              <Link to="/jobs" className="text-blue-600 hover:underline">
                Browse Other Job Listings
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  const deadline = new Date(job.deadline);
  const isExpired = isDeadlinePassed(job.deadline);
  
  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <Link to="/jobs" className="text-blue-100 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Jobs
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{job.title}</h1>
          <div className="flex flex-wrap text-blue-100 mt-2">
            <div className="mr-6 mb-2">
              <span className="opacity-80">Company:</span> {job.employer?.name || 'Unknown Company'}
            </div>
            <div className="mr-6 mb-2">
              <span className="opacity-80">Location:</span> {job.location}
            </div>
            <div className="mr-6 mb-2">
              <span className="opacity-80">Category:</span> {job.category}
            </div>
            <div className="mb-2">
              <span className="opacity-80">Posted:</span> {calculateTimeAgo(job.createdAt)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Job Details */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img 
                      src={job.banner || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.title)}&background=random`} 
                      alt={`${job.title} banner`} 
                      className="w-16 h-16 rounded-lg mr-4 object-cover border border-gray-100"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.title)}&background=random`;
                      }}
                    />
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">{job.title}</h2>
                      <p className="text-gray-600">{job.employer?.name || 'Unknown Company'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleSaveJob}
                    className={`p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 ${isSaved ? 'text-red-500' : 'text-gray-400'}`}
                    title={isSaved ? 'Remove from saved jobs' : 'Save job'}
                  >
                    {isSaved ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="flex flex-wrap mt-4">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full mr-2 mb-2">
                    {job.location}
                  </span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full mr-2 mb-2">
                    {job.category}
                  </span>
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full mr-2 mb-2">
                    {job.salary}
                  </span>
                  {isExpired ? (
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full mb-2">
                      Deadline passed ({formatDate(job.deadline)})
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full mb-2">
                      Apply by {formatDate(job.deadline)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <section className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Job Description</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                    {job.description}
                  </div>
                </section>
                
                {job.requirements && (
                  <section className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Requirements</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                      {job.requirements}
                    </div>
                  </section>
                )}
                
                <section className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Application Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Application Deadline</p>
                      <p className="font-medium text-gray-800">{formatDate(job.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Job Posted</p>
                      <p className="font-medium text-gray-800">{formatDate(job.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Email</p>
                      <p className="font-medium text-gray-800">{job.contactEmail}</p>
                    </div>
                    {job.contactPhone && (
                      <div>
                        <p className="text-sm text-gray-500">Contact Phone</p>
                        <p className="font-medium text-gray-800">{job.contactPhone}</p>
                      </div>
                    )}
                  </div>
                </section>
                
                <div className="mt-8 border-t pt-6 flex justify-between items-center">
                  <div>
                    {job.applicants && (
                      <p className="text-gray-500 text-sm">
                        {job.applicants.length} {job.applicants.length === 1 ? 'person has' : 'people have'} applied
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    {currentUser && job.employer && job.employer._id === currentUser.userId ? (
                      <Link 
                        to={`/jobs/${job._id}/candidates`}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        View Candidates ({job.applicants?.length || 0})
                      </Link>
                    ) : (
                      <button 
                        className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                          isExpired || (job.applicants && job.applicants.some(app => app.userId === currentUser?.userId)) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                        onClick={() => {
                          if (isExpired) return;
                          if (job.applicants && job.applicants.some(app => app.userId === currentUser?.userId)) return;
                          setShowApplicationForm(true);
                        }}
                        disabled={
                          isExpired || 
                          (job.applicants && job.applicants.some(app => app.userId === currentUser?.userId))
                        }
                      >
                        {isExpired 
                          ? 'Deadline Passed' 
                          : (job.applicants && job.applicants.some(app => app.userId === currentUser?.userId))
                            ? 'Applied'
                            : 'Apply Now'
                        }
                      </button>
                    )}
                    
                    <Link 
                      to="/jobs"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Browse More Jobs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Application Form */}
            {showApplicationForm && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="bg-blue-50 p-4 border-b border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-700">Submit Your Application</h3>
                  <p className="text-blue-600 text-sm">Apply for: {job.title} at {job.employer?.name}</p>
                </div>
                
                <form onSubmit={handleApplyToJob} className="p-6">
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="coverLetter">
                      Cover Letter <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows="6"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Introduce yourself and explain why you're a good fit for this position..."
                      value={applicationData.coverLetter}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setShowApplicationForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Company Details */}
            {job.employer && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">About the Company</h3>
                  <div className="flex items-center">
                    <img 
                      src={job.employer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.employer.name)}&background=random`} 
                      alt={job.employer.name} 
                      className="w-12 h-12 rounded-full mr-4 object-cover border border-gray-100"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">{job.employer.name}</h4>
                      <p className="text-gray-600 text-sm">{job.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    For more information about this position, please contact:
                  </p>
                  <div className="text-gray-800">
                    <p><strong>Email:</strong> {job.contactEmail}</p>
                    {job.contactPhone && (
                      <p><strong>Phone:</strong> {job.contactPhone}</p>
                    )}
                  </div>
                  
                  {/* Uncomment if you implement company profiles */}
                  {/* <div className="mt-4">
                    <Link 
                      to={`/company/${job.employer._id}`}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      View Company Profile
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div> */}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Job Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Job Title</p>
                  <p className="font-medium text-gray-800">{job.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-800">{job.employer?.name || 'Unknown Company'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-800">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-800">{job.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium text-gray-800">{job.salary}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Application Deadline</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(job.deadline)}
                    {isExpired && ' (Expired)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Posted</p>
                  <p className="font-medium text-gray-800">{formatDate(job.createdAt)}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={toggleSaveJob}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg mb-3 ${
                    isSaved 
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                      : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                  } transition-colors duration-200`}
                >
                  {isSaved ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save Job
                    </>
                  )}
                </button>
                
                <a 
                  href={`mailto:${job.contactEmail}?subject=Inquiry about ${job.title} position`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Employer
                </a>
              </div>
            </div>
            
            {/* Latest Jobs Sidebar */}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetailPage;