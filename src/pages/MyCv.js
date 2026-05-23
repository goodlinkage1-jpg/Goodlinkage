import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const MyCvPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingCV, setHasExistingCV] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // CV data state
  const [cvData, setCvData] = useState({
    summary: '',
    skills: '',
    experience: [],
    education: [],
    certifications: [],
    languages: '',
    resumeFile: null,
    resumeUrl: ''
  });
  //commiting this for github

  
  
  // Experience form state
  const [expForm, setExpForm] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  
  // Education form state
  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  
  // Certification form state
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    date: '',
    expires: false,
    expiryDate: '',
    description: ''
  });
  
  // Form visibility states
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  
  // Edit indexes
  const [editExpIndex, setEditExpIndex] = useState(-1);
  const [editEduIndex, setEditEduIndex] = useState(-1);
  const [editCertIndex, setEditCertIndex] = useState(-1);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login', { state: { from: '/my-cv' } });
      return;
    }
    
    fetchCvData();
  }, [currentUser]);

  const fetchCvData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/user-cv`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        
        if (data) {
          setCvData({
            summary: data.summary || '',
            skills: data.skills || '',
            experience: data.experience || [],
            education: data.education || [],
            certifications: data.certifications || [],
            languages: data.languages || '',
            resumeFile: null,
            resume: data.resume || ''
          });
          
          setHasExistingCV(true);
        }
        console.log('APi response for my Cv', response.data);
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
      // If 404, user doesn't have a CV yet
      if (error.response && error.response.status === 404) {
        setHasExistingCV(false);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to load your CV. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCvData({
      ...cvData,
      [name]: value
    });
  };

  const handleExpInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExpForm({
      ...expForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If current job is checked, clear end date
    if (name === 'current' && checked) {
      setExpForm(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const handleEduInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEduForm({
      ...eduForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If current education is checked, clear end date
    if (name === 'current' && checked) {
      setEduForm(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  };

  const handleCertInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCertForm({
      ...certForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If certification doesn't expire, clear expiry date
    if (name === 'expires' && !checked) {
      setCertForm(prev => ({
        ...prev,
        expiryDate: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Resume file should be less than 5MB'
        });
        return;
      }
      
      // Check file type (PDF, DOC, DOCX)
      const fileType = file.type;
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(fileType)) {
        setMessage({
          type: 'error',
          text: 'Resume file should be PDF, DOC, or DOCX format'
        });
        return;
      }
      
      setCvData({
        ...cvData,
        resumeFile: file
      });
    }
  };

  const addExperience = () => {
    // Validate required fields
    if (!expForm.title || !expForm.company || !expForm.startDate) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields (Title, Company, Start Date)'
      });
      return;
    }
    
    if (editExpIndex >= 0) {
      // Update existing experience
      const updatedExperiences = [...cvData.experience];
      updatedExperiences[editExpIndex] = expForm;
      
      setCvData({
        ...cvData,
        experience: updatedExperiences
      });
      
      setEditExpIndex(-1);
    } else {
      // Add new experience
      setCvData({
        ...cvData,
        experience: [...cvData.experience, expForm]
      });
    }
    
    // Reset form
    setExpForm({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
    
    setShowExpForm(false);
  };

  const editExperience = (index) => {
    setExpForm(cvData.experience[index]);
    setEditExpIndex(index);
    setShowExpForm(true);
  };

  const removeExperience = (index) => {
    const updatedExperiences = cvData.experience.filter((_, i) => i !== index);
    setCvData({
      ...cvData,
      experience: updatedExperiences
    });
  };

  const addEducation = () => {
    // Validate required fields
    if (!eduForm.institution || !eduForm.degree || !eduForm.startDate) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields (Institution, Degree, Start Date)'
      });
      return;
    }
    
    if (editEduIndex >= 0) {
      // Update existing education
      const updatedEducation = [...cvData.education];
      updatedEducation[editEduIndex] = eduForm;
      
      setCvData({
        ...cvData,
        education: updatedEducation
      });
      
      setEditEduIndex(-1);
    } else {
      // Add new education
      setCvData({
        ...cvData,
        education: [...cvData.education, eduForm]
      });
    }
    
    // Reset form
    setEduForm({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
    
    setShowEduForm(false);
  };

  const editEducation = (index) => {
    setEduForm(cvData.education[index]);
    setEditEduIndex(index);
    setShowEduForm(true);
  };

  const removeEducation = (index) => {
    const updatedEducation = cvData.education.filter((_, i) => i !== index);
    setCvData({
      ...cvData,
      education: updatedEducation
    });
  };

  const addCertification = () => {
    // Validate required fields
    if (!certForm.name || !certForm.issuer || !certForm.date) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields (Name, Issuer, Date)'
      });
      return;
    }
    
    if (editCertIndex >= 0) {
      // Update existing certification
      const updatedCertifications = [...cvData.certifications];
      updatedCertifications[editCertIndex] = certForm;
      
      setCvData({
        ...cvData,
        certifications: updatedCertifications
      });
      
      setEditCertIndex(-1);
    } else {
      // Add new certification
      setCvData({
        ...cvData,
        certifications: [...cvData.certifications, certForm]
      });
    }
    
    // Reset form
    setCertForm({
      name: '',
      issuer: '',
      date: '',
      expires: false,
      expiryDate: '',
      description: ''
    });
    
    setShowCertForm(false);
  };

  const editCertification = (index) => {
    setCertForm(cvData.certifications[index]);
    setEditCertIndex(index);
    setShowCertForm(true);
  };

  const removeCertification = (index) => {
    const updatedCertifications = cvData.certifications.filter((_, i) => i !== index);
    setCvData({
      ...cvData,
      certifications: updatedCertifications
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Prepare the data object
      const data = {
        summary: cvData.summary,
        skills: cvData.skills,
        experience: JSON.stringify(cvData.experience),
        education: JSON.stringify(cvData.education),
        certifications: JSON.stringify(cvData.certifications),
        languages: cvData.languages,
      };
      
      // Convert file to base64 if it exists
      if (cvData.resumeFile) {
        // Read file as base64
        const reader = new FileReader();
        
        // Convert file to base64 string
        const fileBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 part
          reader.onerror = reject;
          reader.readAsDataURL(cvData.resumeFile);
        });
        
        // Add file info to data
        data.resume = fileBase64;
        data.resumeName = cvData.resumeFile.name;
        data.resumeType = cvData.resumeFile.type;
      }
      
      const url = hasExistingCV ? `${API_URL}/user-cv/update` : `${API_URL}/user-cv/create`;
      
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data && response.data.success) {
        setMessage({
          type: 'success',
          text: hasExistingCV ? 'CV updated successfully!' : 'CV created successfully!'
        });
        
        // Refresh CV data
        fetchCvData();
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save CV. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">My CV / Resume</h1>
          <p className="text-blue-100">
            {hasExistingCV ? 'Update your professional profile' : 'Create your professional profile'}
          </p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
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
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {hasExistingCV ? 'Update Your CV' : 'Create Your CV'}
                </h2>
                
                {/* Professional Summary */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="summary">
                    Professional Summary
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={cvData.summary}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A brief summary of your professional background and career goals"
                  />
                </div>
                
                {/* Skills */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="skills">
                    Skills
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={cvData.skills}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="List your key skills (e.g., JavaScript, Project Management, Customer Service)"
                  />
                </div>
                
                {/* Work Experience */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 font-medium">
                      Work Experience
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setExpForm({
                          title: '',
                          company: '',
                          location: '',
                          startDate: '',
                          endDate: '',
                          current: false,
                          description: ''
                        });
                        setEditExpIndex(-1);
                        setShowExpForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Experience
                    </button>
                  </div>
                  
                  {/* Experience List */}
                  {cvData.experience.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {cvData.experience.map((exp, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{exp.title}</h4>
                              <p className="text-gray-600">{exp.company} {exp.location ? `- ${exp.location}` : ''}</p>
                              <p className="text-gray-500 text-sm">
                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => editExperience(index)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExperience(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-gray-600 mt-2 text-sm whitespace-pre-line">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mb-4">No work experience added yet</p>
                  )}
                  
                  {/* Experience Form */}
                  {showExpForm && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {editExpIndex >= 0 ? 'Edit Experience' : 'Add Experience'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Job Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={expForm.title}
                            onChange={handleExpInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Company *
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={expForm.company}
                            onChange={handleExpInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={expForm.location}
                            onChange={handleExpInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="City, Country or Remote"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Start Date *
                          </label>
                          <input
                            type="month"
                            name="startDate"
                            value={expForm.startDate}
                            onChange={handleExpInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            End Date
                          </label>
                          <input
                            type="month"
                            name="endDate"
                            value={expForm.endDate}
                            onChange={handleExpInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            disabled={expForm.current}
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="current-job"
                            name="current"
                            checked={expForm.current}
                            onChange={handleExpInputChange}
                            className="mr-2"
                          />
                          <label htmlFor="current-job" className="text-gray-700 text-sm">
                            I currently work here
                          </label>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={expForm.description}
                          onChange={handleExpInputChange}
                          rows="3"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Describe your responsibilities and achievements"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowExpForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addExperience}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {editExpIndex >= 0 ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Education */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 font-medium">
                      Education
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEduForm({
                          institution: '',
                          degree: '',
                          field: '',
                          startDate: '',
                          endDate: '',
                          current: false,
                          description: ''
                        });
                        setEditEduIndex(-1);
                        setShowEduForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Education
                    </button>
                  </div>
                  
                  {/* Education List */}
                  {cvData.education.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {cvData.education.map((edu, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h4>
                              <p className="text-gray-600">{edu.institution}</p>
                              <p className="text-gray-500 text-sm">
                                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => editEducation(index)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEducation(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {edu.description && (
                            <p className="text-gray-600 mt-2 text-sm">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mb-4">No education added yet</p>
                  )}
                  
                  {/* Education Form */}
                  {showEduForm && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {editEduIndex >= 0 ? 'Edit Education' : 'Add Education'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Institution *
                          </label>
                          <input
                            type="text"
                            name="institution"
                            value={eduForm.institution}
                            onChange={handleEduInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Degree *
                          </label>
                          <input
                            type="text"
                            name="degree"
                            value={eduForm.degree}
                            onChange={handleEduInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Field of Study
                          </label>
                          <input
                            type="text"
                            name="field"
                            value={eduForm.field}
                            onChange={handleEduInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Start Date *
                          </label>
                          <input
                            type="month"
                            name="startDate"
                            value={eduForm.startDate}
                            onChange={handleEduInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            End Date
                          </label>
                          <input
                            type="month"
                            name="endDate"
                            value={eduForm.endDate}
                            onChange={handleEduInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            disabled={eduForm.current}
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="current-education"
                            name="current"
                            checked={eduForm.current}
                            onChange={handleEduInputChange}
                            className="mr-2"
                          />
                          <label htmlFor="current-education" className="text-gray-700 text-sm">
                            I'm currently studying here
                          </label>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={eduForm.description}
                          onChange={handleEduInputChange}
                          rows="2"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Achievements, activities, GPA, etc."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowEduForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addEducation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {editEduIndex >= 0 ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Certifications */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 font-medium">
                      Certifications
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCertForm({
                          name: '',
                          issuer: '',
                          date: '',
                          expires: false,
                          expiryDate: '',
                          description: ''
                        });
                        setEditCertIndex(-1);
                        setShowCertForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Certification
                    </button>
                  </div>
                  
                  {/* Certifications List */}
                  {cvData.certifications.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {cvData.certifications.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{cert.name}</h4>
                              <p className="text-gray-600">Issued by {cert.issuer}</p>
                              <p className="text-gray-500 text-sm">
                                Issued: {formatDate(cert.date)}
                                {cert.expires && cert.expiryDate && (
                                  <> · Expires: {formatDate(cert.expiryDate)}</>
                                )}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => editCertification(index)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCertification(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {cert.description && (
                            <p className="text-gray-600 mt-2 text-sm">{cert.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mb-4">No certifications added yet</p>
                  )}
                  
                  {/* Certification Form */}
                  {showCertForm && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {editCertIndex >= 0 ? 'Edit Certification' : 'Add Certification'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Certification Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={certForm.name}
                            onChange={handleCertInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Issuing Organization *
                          </label>
                          <input
                            type="text"
                            name="issuer"
                            value={certForm.issuer}
                            onChange={handleCertInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1">
                            Issue Date *
                          </label>
                          <input
                            type="month"
                            name="date"
                            value={certForm.date}
                            onChange={handleCertInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="cert-expires"
                            name="expires"
                            checked={certForm.expires}
                            onChange={handleCertInputChange}
                            className="mr-2"
                          />
                          <label htmlFor="cert-expires" className="text-gray-700 text-sm">
                            This certification expires
                          </label>
                        </div>
                        {certForm.expires && (
                          <div>
                            <label className="block text-gray-700 text-sm mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="month"
                              name="expiryDate"
                              value={certForm.expiryDate}
                              onChange={handleCertInputChange}
                              className="w-full p-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={certForm.description}
                          onChange={handleCertInputChange}
                          rows="2"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Description of the certification, skills covered, etc."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCertForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addCertification}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {editCertIndex >= 0 ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Languages */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="languages">
                    Languages
                  </label>
                  <textarea
                    id="languages"
                    name="languages"
                    value={cvData.languages}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Languages you speak and your proficiency level (e.g., English - Native, Spanish - Intermediate)"
                  />
                </div>
                
                {/* Resume Upload */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Resume / CV Document
                  </label>
                  <div className="flex items-center">
                    {cvData.resumeUrl && (
                      <a 
                        href={cvData.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mr-4"
                      >
                        View Current Resume
                      </a>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Upload your resume in PDF, DOC, or DOCX format (max 5MB)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 border-t pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/my-applications')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (hasExistingCV ? 'Update CV' : 'Create CV')}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {!loading && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Tips for Creating an Effective CV</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Keep it Relevant</h4>
                <p className="text-gray-600 text-sm">
                  Tailor your CV to each job application by highlighting relevant skills and experiences.
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Be Concise</h4>
                <p className="text-gray-600 text-sm">
                  Keep your CV to 1-2 pages. Use bullet points and focus on achievements rather than duties.
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Use Action Verbs</h4>
                <p className="text-gray-600 text-sm">
                  Start descriptions with action verbs like "Managed," "Created," or "Implemented."
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Quantify Achievements</h4>
                <p className="text-gray-600 text-sm">
                  Use numbers to demonstrate your impact (e.g., "Increased sales by 20%").
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyCvPage;