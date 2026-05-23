import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../../Config';

const CreateJob = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    category: 'IT & Software',
    description: '',
    deadline: '',
    location: '',
    salary: '',
    requirements: '',
    contactEmail: '',
    contactPhone: '',
    banner: null,
    bannerPreview: null
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  
  // Job categories for dropdown
  const jobCategories = [
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

  // Salary ranges
  const salaryRanges = [
    "Negotiable",
    "Under $1,000",
    "$1,000 - $3,000",
    "$3,000 - $5,000",
    "$5,000 - $10,000",
    "Above $10,000"
  ];
 
  useEffect(() => {
    // Pre-fill contact information from user profile
    if (currentUser) {
      setJobData(prev => ({
        ...prev,
        contactEmail: currentUser.email || '',
        contactPhone: currentUser.phone || '',
        bannerPreview: `https://ui-avatars.com/api/?name=${encodeURIComponent('Job')}&background=random`
      }));
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, [currentUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data;
        
        setJobData(prev => ({
          ...prev,
          contactEmail: userData.email || '',
          contactPhone: userData.phone || '',
          bannerPreview: `https://ui-avatars.com/api/?name=${encodeURIComponent('Job')}&background=random`
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load profile data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Image size should be less than 2MB'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        
        setJobData(prev => ({
          ...prev,
          banner: file,
          bannerPreview: base64String,
          bannerBase64: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Prepare job data for submission
      const newJobData = {
        title: jobData.title,
        category: jobData.category,
        description: jobData.description,
        deadline: jobData.deadline,
        location: jobData.location,
        salary: jobData.salary,
        requirements: jobData.requirements,
        contactEmail: jobData.contactEmail,
        contactPhone: jobData.contactPhone,
        banner: jobData.bannerBase64 || jobData.bannerPreview
      };
      
      const response = await axios.post(`${API_URL}/jobs/create`, newJobData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        // Show success message
        setMessage({
          type: 'success',
          text: 'Job posted successfully!'
        });
        
        // Reset form
        setJobData({
          title: '',
          category: 'personal',
          description: '',
          deadline: '',
          location: '',
          salary: '',
          requirements: '',
          contactEmail: currentUser?.email || '',
          contactPhone: currentUser?.phone || '',
          banner: null,
          bannerPreview: `https://ui-avatars.com/api/?name=${encodeURIComponent('Job')}&background=random`
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create job. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setJobData({
      title: '',
      category: 'personal',
      description: '',
      deadline: '',
      location: '',
      salary: '',
      requirements: '',
      contactEmail: currentUser?.email || '',
      contactPhone: currentUser?.phone || '',
      banner: null,
      bannerPreview: `https://ui-avatars.com/api/?name=${encodeURIComponent('Job')}&background=random`
    });
    setMessage({ type: '', text: '' });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Job</h1>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Display message if there is one */}
            {message.text && (
              <div className={`p-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Job Banner Image */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                  <div 
                    className="w-32 h-32 rounded-lg overflow-hidden border-4 border-blue-100 cursor-pointer relative group"
                    onClick={handleImageClick}
                  >
                    <img 
                      src={jobData.bannerPreview} 
                      alt="Job Banner" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent('Job')}&background=random`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">Change Banner</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    className="text-blue-600 text-sm hover:underline"
                    onClick={handleImageClick}
                  >
                    Upload Job Banner
                  </button>
                  <span className="text-xs text-gray-500">Max size: 2MB</span>
                </div>
                
                {/* Form Fields */}
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={jobData.title}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter job title"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                        Job Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={jobData.category}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {jobCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="deadline">
                        Deadline Date *
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={jobData.deadline}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="location">
                        Location *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={jobData.location}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Job location"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="salary">
                        Salary Range
                      </label>
                      <select
                        id="salary"
                        name="salary"
                        value={jobData.salary}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a range</option>
                        {salaryRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                      Job Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={jobData.description}
                      onChange={handleChange}
                      rows="6"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the job responsibilities and details"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="requirements">
                      Requirements
                    </label>
                    <textarea
                      id="requirements"
                      name="requirements"
                      value={jobData.requirements}
                      onChange={handleChange}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List required qualifications, skills, or experience"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="contactEmail">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={jobData.contactEmail}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email for applications"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="contactPhone">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        id="contactPhone"
                        name="contactPhone"
                        value={jobData.contactPhone}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phone number (optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 border-t pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Posting Job...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateJob;