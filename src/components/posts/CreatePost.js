import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../../Config';

const CreatePost = ({ onPostCreated }) => {
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [encodedImages, setEncodedImages] = useState([]);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  // Convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Filter for image files only
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/')
    );
    
    // Maximum of 5 images
    const imagesToProcess = imageFiles.slice(0, 5 - selectedImages.length);
    
    if (imagesToProcess.length === 0) return;
    
    try {
      // Convert each image to base64
      const base64Promises = imagesToProcess.map(file => convertToBase64(file));
      const base64Results = await Promise.all(base64Promises);
      
      // Update state with new images
      setSelectedImages(prev => [...prev, ...imagesToProcess]);
      setEncodedImages(prev => [...prev, ...base64Results]);
    } catch (error) {
      console.error('Error converting images to base64:', error);
      setError('Failed to process images. Please try again.');
    }
  };

  // Remove an image from selection
  const removeImage = (index) => {
    setSelectedImages(prevImages => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
    
    setEncodedImages(prevEncoded => {
      const newEncoded = [...prevEncoded];
      newEncoded.splice(index, 1);
      return newEncoded;
    });
  };

  // Trigger file input click
  const openFileSelector = () => {
    fileInputRef.current.click();
  };
  
  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && encodedImages.length === 0) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/create-post`, {
        content: newPostContent,
        files: encodedImages // Send array of base64 encoded images
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      // Clear the form after successful post
      setNewPostContent('');
      setSelectedImages([]);
      setEncodedImages([]);
      
      // Call the callback function to update the parent component
      if (onPostCreated && response.data.success) {
        onPostCreated(response.data.data);
      }
    } catch (error) {
      // Handle errors
      const errorMessage = 
        error.response?.data?.message || 
        'Failed to create post. Please try again.';
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start space-x-3 mb-4">
        <img 
          src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=random`}
          alt={currentUser.name || 'User'} 
          className="w-10 h-10 rounded-full object-cover" 
        />
        <div className="flex-grow">
          <form onSubmit={handlePostSubmit}>
            <textarea
              className="w-full bg-gray-100 rounded-lg py-2 px-4 focus:outline-none min-h-[60px] resize-none"
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            {/* Image previews */}
            {encodedImages.length > 0 && (
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {encodedImages.map((base64Image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={base64Image} 
                      alt={`Preview ${index}`} 
                      className="h-24 w-full object-cover rounded-md" 
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </form>
        </div>
      </div>
      
      <div className="border-t pt-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              type="button"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
              onClick={openFileSelector}
              disabled={isSubmitting || selectedImages.length >= 5}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Add Images {selectedImages.length > 0 && `(${selectedImages.length}/5)`}</span>
            </button>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>
          
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none disabled:opacity-50"
            disabled={(!newPostContent.trim() && encodedImages.length === 0) || isSubmitting}
            onClick={handlePostSubmit}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;