import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import ProductSubmissionForm from './ProductSubmissionForm';
import NearbyProductNotification from '../components/notifications/NearbyProductNotification';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 2000000]); // Increased max price
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [cartItems, setCartItems] = useState([]);
  // New state for location tracking
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [proximityThreshold, setProximityThreshold] = useState(1000); // 1km by default

  const { currentUser } = useAuth();

  // Modified useEffect section to properly handle categories
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        // Define base categories
        const baseCategories = [
          { id: 'furniture', name: 'Furniture', count: 0 },
          { id: 'electronics', name: 'Electronics', count: 0 },
          { id: 'clothing', name: 'Clothing', count: 0 },
          { id: 'accessories', name: 'Accessories', count: 0 },
          { id: 'kitchen', name: 'Kitchen', count: 0 },
          { id: 'outdoor', name: 'Outdoor', count: 0 },
          { id: 'Other', name: 'Other', count: 0 }
        ];

        // Fetch products from API
        const response = await axios.get(`${API_URL}/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        console.log("API response", response.data);
        console.log("Current User ID:", currentUser.id);

        // Process the API response with better error handling
        const apiProducts = response.data.data.map(product => {
          console.log("Processing product:", product);
          
          return {
            id: product._id,
            title: product.productname || 'Unnamed Product',
            description: product.description || 'No description available',
            price: product.price || 0,
            category: product.category || 'Other',
            image: product.productimage && product.productimage.length > 0 
              ? product.productimage[0] 
              : 'https://via.placeholder.com/300x200',
            createdAt: product.createdAt || new Date().toISOString(),
            Status: product.status || 'In Stock',
            location: {
              latitude: product.location?.latitude || 0,
              longitude: product.location?.longitude || 0,
              address: product.location?.address || ''
            },
            author: {
              id: product.seller?._id || 'unknown',
              name: product.seller?.name || 'Unknown Seller',
              avatar: product.seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller?.name || 'Unknown')}&background=random`,
              rating: 5.0 // Default rating as API doesn't provide this
            }
          };
        });

        console.log("Mapped products:", apiProducts);
        
        // First, collect all unique categories from the API
        const uniqueCategories = new Set(apiProducts.map(product => 
          product.category ? product.category.toLowerCase() : 'other'
        ));
        console.log("Unique categories from API:", Array.from(uniqueCategories));
        
        // Create a map for quick lookup - make all keys lowercase
        const categoryMap = new Map(baseCategories.map(cat => [cat.id.toLowerCase(), cat]));
        
        // Count products in each category
        apiProducts.forEach(product => {
          if (product.category) {
            const lowerCaseCategory = product.category.toLowerCase();
            if (categoryMap.has(lowerCaseCategory)) {
              // Increment count for matching category
              const category = categoryMap.get(lowerCaseCategory);
              category.count += 1;
            } else {
              // Add to "Other" category if it doesn't match
              const otherCategory = categoryMap.get('other');
              if (otherCategory) {
                otherCategory.count += 1;
              }
            }
          }
        });
        
        // Convert map back to array
        const updatedCategories = Array.from(categoryMap.values());

        setCategories(updatedCategories);
        setProducts(apiProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchMarketplaceData();
  }, []);

  const handleAddToCart = (productId) => {
    const productToAdd = products.find(product => product.id === productId);
    
    if (productToAdd && !cartItems.some(item => item.id === productId)) {
      setCartItems([...cartItems, productToAdd]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  // Toggle location tracking
  const toggleLocationTracking = () => {
    setLocationTrackingEnabled(!locationTrackingEnabled);
  };
  
  // Update proximity threshold
  const handleProximityChange = (e) => {
    setProximityThreshold(parseInt(e.target.value, 10));
  };
  
  const handleProductSubmit = async (newProduct) => {
    try {
      // Here you would typically send the new product to your API
      // For now, we're just updating the local state
      
      // Update the category count
      const updatedCategories = categories.map(category => {
        if (category.id.toLowerCase() === newProduct.category.toLowerCase()) {
          return { ...category, count: category.count + 1 };
        }
        return category;
      });
      
      setCategories(updatedCategories);
      
      // Add the new product to the products list
      setProducts([newProduct, ...products]);
    } catch (error) {
      console.error('Error submitting product:', error);
    }
  };

  // Debug log for filtering
  console.log("Before filtering, products count:", products.length);
  products.forEach(product => {
    console.log(`Product: ${product.title}, Category: ${product.category}, Price: ${product.price}`);
  });

  const filteredProducts = products.filter(product => {
    // Case-insensitive search matching
    const matchesSearch = searchTerm === '' || 
      (product.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (Array.isArray(product.tags) && product.tags.some(tag => 
        (tag?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      ));
    
    // Case-insensitive category matching
    const matchesCategory = activeCategory === 'all' || 
      (product.category?.toLowerCase() || '') === activeCategory.toLowerCase();
    
    // Price range matching - handle high prices
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    const result = matchesSearch && matchesCategory && matchesPrice;
    console.log(`Filter result for ${product.title}: ${result} (Search: ${matchesSearch}, Category: ${matchesCategory}, Price: ${matchesPrice})`);
    
    return result;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return a.price - b.price;
      case 'priceDesc':
        return b.price - a.price;
      case 'popular':
        return (b.sales || 0) - (a.sales || 0);
      case 'newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  console.log("After filtering, products count:", filteredProducts.length);

  const ProductCard = ({ product, viewType = 'grid' }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${viewType === 'grid' ? '' : 'flex'}`}>
      <div className={viewType === 'grid' ? '' : 'w-1/4'}>
        <img 
          src={product.image || 'https://via.placeholder.com/300x200'} 
          alt={product.title} 
          className={`w-full h-48 object-cover ${viewType === 'list' ? 'h-full' : ''}`}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://via.placeholder.com/300x200';
          }}
        />
      </div>
      
      <div className={`p-4 ${viewType === 'list' ? 'w-3/4' : ''}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{product.title}</h3>
            <div className="flex items-center mt-1">
              <img 
                src={product.author.avatar} 
                className="w-6 h-6 rounded-full mr-2"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/40';
                }}
              />
              <span className="text-sm text-gray-600">{product.author.name}</span>
            </div>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {product.category?.charAt(0).toUpperCase() + product.category?.slice(1) || 'Uncategorized'}
              </span>
            </div>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {product.Status}
              </span>
            </div>
          </div>
          <span className="text-lg font-bold text-blue-600">{product.price} Rwf</span>
        </div>
        
        <p className={`text-gray-600 text-sm mt-2 ${viewType === 'grid' ? 'line-clamp-2' : ''}`}>
          {product.description}
        </p>
        
        {/* Show location information */}
        {product.location && product.location.address && (
          <div className="mt-2 flex items-center text-gray-500 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={`${viewType === 'grid' ? 'line-clamp-1' : ''}`}>
              {product.location.address}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">Marketplace</h1>
          <p className="text-blue-100 text-xl mb-8 max-w-3xl mx-auto text-center">
            Discover high-quality products or list your own items for sale
          </p>
          
          {/* Product Submission Form */}
          {currentUser?.accounttype !== 'personal' && (
            <ProductSubmissionForm 
              onSubmit={handleProductSubmit} 
              categories={categories} 
            />
          )}
          
          {/* Search Bar - Below the form */}
          <div className="mt-8 flex items-center space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full p-3 pl-10 rounded-lg border-0 shadow-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Categories</h3>
                <ul>
                  <li className="mb-2">
                    <button 
                      className={`w-full text-left py-2 px-3 rounded-lg ${activeCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                      onClick={() => handleCategoryChange('all')}
                    >
                      All Categories
                      <span className="float-right text-gray-500">{products.length}</span>
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id} className="mb-2">
                      <button 
                        className={`w-full text-left py-2 px-3 rounded-lg ${activeCategory.toLowerCase() === category.id.toLowerCase() ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                        <span className="float-right text-gray-500">{category.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Location Settings */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Location Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={locationTrackingEnabled}
                        onChange={toggleLocationTracking}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>Notify me about nearby products</span>
                    </label>
                  </div>
                  
                  {locationTrackingEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notification distance: {proximityThreshold/1000} km
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="5000"
                        step="100"
                        value={proximityThreshold}
                        onChange={handleProximityChange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>100m</span>
                        <span>5km</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Products */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                    {activeCategory === 'all' ? 'All Products' : categories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase())?.name || activeCategory} 
                    <span className="text-gray-500 text-lg ml-2">({filteredProducts.length})</span>
                  </h2>
                  
                  <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    <select 
                      className="p-2 border border-gray-300 rounded-lg"
                      value={sortBy}
                      onChange={handleSortChange}
                    >
                      <option value="newest">Newest</option>
                      <option value="popular">Most Popular</option>
                      <option value="priceAsc">Price: Low to High</option>
                      <option value="priceDesc">Price: High to Low</option>
                    </select>
                    
                    <button 
                      className="p-2 border border-gray-300 rounded-lg flex items-center justify-center"
                      onClick={toggleViewMode}
                    >
                      {viewMode === 'grid' ? 'List View' : 'Grid View'}
                    </button>
                  </div>
                </div>
                
                {filteredProducts.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
                    {filteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} viewType={viewMode} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No products match your current filters</p>
                    {/* Display all products if filters are active but no matches */}
                    {(activeCategory !== 'all' || searchTerm !== '') && (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        onClick={() => {
                          setActiveCategory('all');
                          setSearchTerm('');
                        }}
                      >
                        Show All Products
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add the NearbyProductNotification component */}
      <NearbyProductNotification 
        products={products} 
        enabled={locationTrackingEnabled}
        threshold={proximityThreshold}
      />
    </Layout>
  );
};

export default MarketplacePage;