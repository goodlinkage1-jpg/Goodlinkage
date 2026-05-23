import React, { useState } from 'react';
import axios from 'axios';

/**
 * SellerUpload.jsx
 * Component for sellers to upload property listings with KML files
 * 
 * Features:
 * - KML/KMZ file upload
 * - Property details form (title, price, category, description)
 * - Photo upload
 * - Property area size
 * - Form validation
 * - Progress indication
 */

const SellerUpload = ({ onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    category: 'land',
    address: '',
    city: '',
    country: '',
    areaSize: {
      value: '',
      unit: 'sqm'
    },
    photos: []
  });

  // File state
  const [kmlFile, setKmlFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'areaSize.value') {
      setFormData(prev => ({
        ...prev,
        areaSize: {
          ...prev.areaSize,
          value: value
        }
      }));
    } else if (name === 'areaSize.unit') {
      setFormData(prev => ({
        ...prev,
        areaSize: {
          ...prev.areaSize,
          unit: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle KML file selection
  const handleKmlFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.kml', '.kmz'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setError('Only KML and KMZ files are allowed');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setKmlFile(file);
    setError('');
  };

  // Handle photo file selection
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    if (files.length + photoFiles.length > 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each photo must be less than 10MB');
      return;
    }

    setPhotoFiles(prev => [...prev, ...files]);

    // Generate preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  };

  // Remove a photo
  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.address.trim()) errors.push('Address is required');
    if (!kmlFile) errors.push('KML file is required');

    return errors;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();

      // Add KML file
      formDataToSend.append('kmlFile', kmlFile);

      // Add form data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city || '');
      formDataToSend.append('country', formData.country || '');

      // Add area size if provided
      if (formData.areaSize.value) {
        formDataToSend.append(
          'areaSize',
          JSON.stringify({
            value: parseFloat(formData.areaSize.value),
            unit: formData.areaSize.unit
          })
        );
      }

      // In production, upload photos to Cloudinary and get URLs
      // For MVP, we'll skip photo upload
      // formDataToSend.append('photos', JSON.stringify(photoUrls));

      // Get token from localStorage
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication token not found. Please login.');
        setLoading(false);
        return;
      }

      // Make API request
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/listings`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (response.data.success) {
        setSuccess('Listing created successfully!');

        // Reset form
        setFormData({
          title: '',
          description: '',
          price: '',
          currency: 'USD',
          category: 'land',
          address: '',
          city: '',
          country: '',
          areaSize: { value: '', unit: 'sqm' },
          photos: []
        });
        setKmlFile(null);
        setPhotoFiles([]);
        setPhotoPreviewUrls([]);
        setUploadProgress(0);

        // Call callback if provided
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        setError(response.data.message || 'Failed to create listing');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error uploading listing'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Upload Property Listing</h1>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Property Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Residential Land Plot in Kigali"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="land">Land</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="RWF">RWF</option>
                  <option value="CDF">CDF</option>
                  <option value="XOF">XOF</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address or location description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Kigali"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="e.g., Rwanda"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Area Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Size
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="areaSize.value"
                  value={formData.areaSize.value}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="areaSize.unit"
                  value={formData.areaSize.unit}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sqm">m²</option>
                  <option value="sqft">ft²</option>
                  <option value="hectare">Hectare</option>
                  <option value="acre">Acre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed information about the property..."
              rows="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* KML File Upload */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Property Boundary (KML File)</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="kmlFile"
              accept=".kml,.kmz"
              onChange={handleKmlFileChange}
              className="hidden"
            />
            <label
              htmlFor="kmlFile"
              className="cursor-pointer"
            >
              <div className="text-gray-600">
                <p className="text-lg font-medium mb-2">Drop your KML file here or click to browse</p>
                <p className="text-sm text-gray-500">Supported formats: KML, KMZ (max 50MB)</p>
              </div>
            </label>

            {kmlFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">
                  ✓ {kmlFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Photos Upload */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Property Photos</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              id="photos"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <label htmlFor="photos" className="cursor-pointer">
              <div className="text-gray-600 text-center">
                <p className="text-lg font-medium mb-2">Click to add photos</p>
                <p className="text-sm text-gray-500">
                  Max 10 photos, 10MB each (JPG, PNG, WebP)
                </p>
              </div>
            </label>

            {/* Photo Previews */}
            {photoPreviewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="border-b pb-6">
            <div className="bg-gray-200 rounded-lg h-2">
              <div
                className="bg-blue-500 h-2 rounded-lg transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Uploading: {uploadProgress}%</p>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Uploading...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerUpload;
