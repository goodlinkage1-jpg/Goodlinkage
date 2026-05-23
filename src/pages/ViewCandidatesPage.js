import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const ViewCandidatesPage = () => {
  const { jobId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Application status options
  const statusOptions = [
    { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reviewing', label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'interview', label: 'Interview Stage', color: 'bg-purple-100 text-purple-800' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  ];

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!currentUser) {
          // Redirect to login if not logged in
          navigate('/login', { state: { from: `/jobs/${jobId}/candidates` } });
          return;
        }
        
        // Fetch job details
        const jobResponse = await axios.get(`${API_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (jobResponse.data && jobResponse.data.success) {
          const jobData = jobResponse.data.data;
          setJob(jobData);
          
          // Check if current user is the employer who posted this job
          if (jobData.employer._id !== currentUser.userId && currentUser.accounttype !== 'small_business') {
            setError('You do not have permission to view this page');
            return;
          }
          
          // Fetch candidates
          const candidatesResponse = await axios.get(`${API_URL}/jobs/${jobId}/candidates`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
          
          if (candidatesResponse.data && candidatesResponse.data.success) {
            setCandidates(candidatesResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to load candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [jobId, currentUser, navigate]);
  
  // Add this function at the top of your component
const convertBase64ToUrl = (base64String, fileName = 'resume.pdf', contentType = 'application/pdf') => {
    // Check if it's already a URL (starting with http:// or https://)
    if (base64String && (base64String.startsWith('http://') || base64String.startsWith('https://'))) {
      return base64String;
    }
    
    // Check if it's a base64 string
    if (base64String && typeof base64String === 'string') {
      try {
        // If the string doesn't have the data URI prefix, add it
        const dataUri = base64String.startsWith('data:') 
          ? base64String 
          : `data:${contentType};base64,${base64String}`;
          
        // Create a Blob from the data URI
        const byteString = atob(dataUri.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const intArray = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          intArray[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: contentType });
        
        // Create a URL for the Blob
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error converting base64 to URL:', error);
        return null;
      }
    }
    
    return null;
  };
  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`${API_URL}/jobs/${jobId}/candidates/${candidateId}/status`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // Update the candidate status in the state
        setCandidates(prevCandidates => 
          prevCandidates.map(candidate => 
            candidate._id === candidateId 
              ? { ...candidate, status: newStatus, updatedAt: new Date().toISOString() } 
              : candidate
          )
        );
        
        // Update selected candidate if it's the one being modified
        if (selectedCandidate && selectedCandidate._id === candidateId) {
          setSelectedCandidate(prev => ({ ...prev, status: newStatus, updatedAt: new Date().toISOString() }));
        }
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      setError(error.response?.data?.message || 'Failed to update status. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusLabel = (status) => {
    if (!status) return 'Unknown Status';
    const statusLowerCase = status.toLowerCase();
    const statusOption = statusOptions.find(option => option.value === statusLowerCase);
    return statusOption?.label || 'Unknown Status';
  };
  
  // Similarly update getStatusColor function
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLowerCase = status.toLowerCase();
    const statusOption = statusOptions.find(option => option.value === statusLowerCase);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };
  
  const filteredCandidates = filterStatus === 'all' 
    ? candidates 
    : candidates.filter(candidate => candidate.status === filterStatus);
  
  if (loading && !job) {
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
              <Link to="/job" className="text-blue-600 hover:underline">
                Return to Job Listings
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {job && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center mb-4">
                <Link to="/job" className="text-blue-100 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Jobs
                </Link>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Candidates for {job.title}</h1>
              <div className="flex flex-wrap text-blue-100 mt-2">
                <div className="mr-6 mb-2">
                  <span className="opacity-80">Company:</span> {job.employer?.name || 'Unknown Company'}
                </div>
                <div className="mr-6 mb-2">
                  <span className="opacity-80">Location:</span> {job.location}
                </div>
                <div className="mr-6 mb-2">
                  <span className="opacity-80">Deadline:</span> {formatDate(job.deadline)}
                </div>
                <div className="mb-2">
                  <span className="opacity-80">Total Applications:</span> {candidates.length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 py-8">
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b">
                <div className="flex flex-wrap items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Applicants ({candidates.length})
                  </h2>
                  
                  <div className="mt-4 md:mt-0 flex items-center">
                    <label className="text-gray-700 mr-2">Filter by status:</label>
                    <select
                      className="p-2 border border-gray-300 rounded-lg text-gray-700"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Candidates</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Candidates List */}
                <div className="md:col-span-1 border-r border-gray-200 max-h-[70vh] overflow-y-auto">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <div 
                        key={candidate._id} 
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                          selectedCandidate && selectedCandidate._id === candidate._id 
                            ? 'bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        <div className="flex items-start">
                          <img 
                            src={candidate.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.user?.name || 'Unknown')}&background=random`} 
                            alt={candidate.user?.name} 
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <h3 className="font-medium text-gray-800">{candidate.user?.name || 'Unknown Applicant'}</h3>
                            <p className="text-gray-500 text-sm">{candidate.user?.email || 'No email provided'}</p>
                            <div className="mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(candidate.status)}`}>
                                {getStatusLabel(candidate.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Applied: {formatDate(candidate.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No candidates match the selected filter
                    </div>
                  )}
                </div>
                
                {/* Candidate Details */}
                <div className="md:col-span-2 p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
                  {selectedCandidate ? (
                    <div>
                      <div className="flex flex-wrap md:flex-nowrap items-start justify-between mb-6">
                        <div className="flex items-center">
                          <img 
                            src={selectedCandidate.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCandidate.user?.name || 'Unknown')}&background=random&size=128`} 
                            alt={selectedCandidate.user?.name} 
                            className="w-16 h-16 rounded-full mr-4"
                          />
                          <div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                              {selectedCandidate.user?.name || 'Unknown Applicant'}
                            </h2>
                            <p className="text-gray-600">{selectedCandidate.user?.email}</p>
                            {selectedCandidate.user?.phone && (
                              <p className="text-gray-600">{selectedCandidate.user?.phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0">
                          <select
                            className={`p-2 border border-gray-300 rounded-lg ${getStatusColor(selectedCandidate.status)}`}
                            value={selectedCandidate.status}
                            onChange={(e) => handleStatusChange(selectedCandidate._id, e.target.value)}
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Application Details</h3>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Applied On:</p>
                              <p className="text-gray-700">{formatDate(selectedCandidate.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Last Updated:</p>
                              <p className="text-gray-700">{formatDate(selectedCandidate.updatedAt)}</p>
                            </div>
                          </div>
                          
                          {selectedCandidate.coverLetter && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-1">Cover Letter:</p>
                              <div className="bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-line">
                                {selectedCandidate.coverLetter}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedCandidate.user?.cv && (
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Resume/CV</h3>
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                          {selectedCandidate.user.cv.resume ? (
                                    <a 
                                    href={convertBase64ToUrl(selectedCandidate.user.cv.resume)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                    download="resume.pdf"
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    View Resume/CV
                                    </a>
                                ) : (
                                    <div className="text-gray-500">No resume file available</div>
                                )}
                            
                            {selectedCandidate.user.cv.summary && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-700 mb-1">Professional Summary</h4>
                                <p className="text-gray-600">{selectedCandidate.user.cv.summary}</p>
                              </div>
                            )}
                            
                            {selectedCandidate.user.cv.skills && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-700 mb-1">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedCandidate.user.cv.skills.split(',').map((skill, index) => (
                                    <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-6 space-x-4">
                      <button 
                          onClick={() => handleStatusChange(selectedCandidate._id, 'Hired')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                           Hired
                        </button>
                      <button 
                          onClick={() => handleStatusChange(selectedCandidate._id, 'Shortlisted')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                           ShortList
                        </button>
                        <button 
                          onClick={() => handleStatusChange(selectedCandidate._id, 'Rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Reject
                        </button>
                        <a 
                          href={`mailto:${selectedCandidate.user?.email}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Contact Candidate
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p>Select a candidate to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
                </div>
                
                <div>
                  {job.requirements && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-700 mb-2">Requirements</h3>
                      <p className="text-gray-600 whitespace-pre-line">{job.requirements}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Job Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-gray-600">
                      <div>
                        <p className="text-sm text-gray-500">Category:</p>
                        <p>{job.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location:</p>
                        <p>{job.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Salary:</p>
                        <p>{job.salary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Posted:</p>
                        <p>{formatDate(job.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* <div className="mt-6 flex justify-end">
                <Link 
                  to={`/jobs/${job._id}/edit`}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Edit Job Posting
                </Link>
              </div> */}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default ViewCandidatesPage;