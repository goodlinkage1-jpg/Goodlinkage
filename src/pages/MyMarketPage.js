import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { API_URL } from '../../Config';
import { useAuth } from '../contexts/AuthContext';

const MyMarketPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 2000000]); // Increased max price
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [cartItems, setCartItems] = useState([]);

  const { currentUser } = useAuth();

  // Define base categories
  const baseCategories = [
    { id: 'all', name: 'All Products', count: 0 },
    { id: 'electronics', name: 'Electronics', count: 0 },
    { id: 'furniture', name: 'Furniture', count: 0 },
    { id: 'clothing', name: 'Clothing', count: 0 },
    { id: 'books', name: 'Books', count: 0 },
    { id: 'other', name: 'Other', count: 0 }
  ];

  // Modified useEffect section to properly handle categories
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        // Fetch products from API
        const response = await axios.get(`${API_URL}/myproduct`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        console.log("API response", response.data);

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
            Status:product.status || 'In Stock',
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
        const categoryMap = new Map(baseCategories.map(cat => [cat.id.toLowerCase(), {...cat, count: 0}]));
        
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
        
        // Count all products for "All" category
        const allCategory = categoryMap.get('all');
        if (allCategory) {
          allCategory.count = apiProducts.length;
        }
        
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

  // Filter products based on search, category, and price
  const filteredProducts = products.filter(product => {
    // Check if product matches search term
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if product matches active category
    const matchesCategory = activeCategory === 'all' || 
                           (product.category && product.category.toLowerCase() === activeCategory.toLowerCase());
    
    // Check if product is within price range
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort products based on sortBy state
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });
  
  const ProductCard = ({ product, viewType = 'grid' }) => {
    if (!product) return null;
    
    const [isSold, setIsSold] = useState(product.sold || false);
    const [updating, setUpdating] = useState(false);
    
    const handleSoldStatusChange = async () => {
      try {
        setUpdating(true);
        setLoading(true);
        // Make API call to update product status
        const response = await axios.put(
          `${API_URL}/products/${product.id}`, 
          { status: "Sold" },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.success) {
          // setIsSold(!isSold);
          
          setLoading(false)
          console.log(response.data.message);
        } else {
          console.error('Failed to update product status:', response.data.message);
        }
      } catch (error) {
        console.error('Error updating product status:', error);
      } finally {
        setUpdating(false);
        
      }
    };
    
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${viewType === 'grid' ? '' : 'flex'}`}>
        <div className={viewType === 'grid' ? 'relative' : 'relative w-1/4'}>
          {isSold && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD</span>
            </div>
          )}
          <img 
            src={product.image || 'https://via.placeholder.com/300x200'} 
            alt={product.title} 
            className={`w-full h-48 object-cover ${viewType === 'list' ? 'h-full' : ''} ${isSold ? 'opacity-70' : ''}`}
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
                  {product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Uncategorized'}
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
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSoldStatusChange}
              disabled={updating}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                updating ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                isSold ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {updating ? 'Updating...' : isSold ? 'Mark as Available' : 'Mark as Sold'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProducts.length > 0 ? (
              sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} viewType={viewMode} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-500 text-lg">No products found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyMarketPage;