import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../../Config';

// Updated Marketplace Chatbot Component
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your marketplace assistant. I can help you find products, check prices, and discover what's available in our marketplace. What are you looking for today?", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Enhanced state management for marketplace products
  const [products, setProducts] = useState({});
  const [productCategories, setProductCategories] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  // Fetch all marketplace products from API
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        // Fetch all products from marketplace (same as marketplace page)
        const response = await axios.get(`${API_URL}/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        console.log("Chatbot API response", response.data);
        
        // Process products into enhanced format (same as marketplace)
        const productData = {};
        const categoryData = {};
        const processedProducts = [];
        
        response.data.data.forEach(product => {
          console.log("Processing product for chatbot:", product);
          
          // Create the product object matching marketplace structure
          const productInfo = {
            id: product._id,
            name: product.productname || 'Unnamed Product',
            title: product.productname || 'Unnamed Product',
            description: product.description || 'No description available',
            price: product.price || 0,
            formattedPrice: `${product.price || 0} Rwf`,
            category: product.category || 'Other',
            status: product.status || 'In Stock',
            image: product.productimage && product.productimage.length > 0 
              ? product.productimage[0] 
              : 'https://via.placeholder.com/300x200',
            createdAt: product.createdAt || new Date().toISOString(),
            location: {
              latitude: product.location?.latitude || 0,
              longitude: product.location?.longitude || 0,
              address: product.location?.address || ''
            },
            author: {
              id: product.seller?._id || 'unknown',
              name: product.seller?.name || 'Unknown Seller',
              avatar: product.seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller?.name || 'Unknown')}&background=random`,
              rating: 5.0
            },
            inStock: product.status !== 'Out of Stock',
            quantity: product.quantity || 0
          };
          
          // Create multiple search keywords
          const keywords = [
            product.productname?.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
            product.productname?.toLowerCase().replace(/[^a-z0-9]/g, ''),
            ...(product.productname?.toLowerCase().split(' ').filter(word => word && word.length > 2) || [])
          ].filter(Boolean);
          
          productInfo.keywords = keywords;
          
          // Store by multiple keywords for better matching
          keywords.forEach(keyword => {
            if (keyword) {
              productData[keyword] = productInfo;
            }
          });
          
          // Organize by category
          const category = (productInfo.category || 'other').toLowerCase();
          if (!categoryData[category]) {
            categoryData[category] = [];
          }
          categoryData[category].push(productInfo);
          
          processedProducts.push(productInfo);
        });
        
        setProducts(productData);
        setProductCategories(categoryData);
        setAllProducts(processedProducts);
        setIsProductsLoaded(true);
        
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
        setIsProductsLoaded(true);
      }
    };
    
    fetchMarketplaceData();
  }, []);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced product matching function
  const findMatchingProducts = (query) => {
    const queryLower = query.toLowerCase();
    const matchedProducts = new Set();
    
    // Direct keyword matching
    Object.keys(products).forEach(keyword => {
      if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
        matchedProducts.add(products[keyword]);
      }
    });
    
    // Category matching
    Object.keys(productCategories).forEach(category => {
      if (queryLower.includes(category)) {
        productCategories[category].forEach(product => {
          matchedProducts.add(product);
        });
      }
    });
    
    // Seller name matching
    allProducts.forEach(product => {
      if (product.author.name && queryLower.includes(product.author.name.toLowerCase())) {
        matchedProducts.add(product);
      }
    });
    
    return Array.from(matchedProducts);
  };

  // Enhanced response generation
  const generateIntelligentResponse = (userMessage) => {
    const messageLC = userMessage.toLowerCase();
    const matchedProducts = findMatchingProducts(userMessage);
    
    // Greeting responses
    if (messageLC.includes('hello') || messageLC.includes('hi') || messageLC.includes('hey')) {
      const totalProducts = allProducts.length;
      const availableCategories = Object.keys(productCategories).length;
      return `Hello! Welcome to our marketplace! 🛍️\n\nWe currently have ${totalProducts} products across ${availableCategories} categories. I'm here to help you find exactly what you need. What can I help you discover today?`;
    }
    
    // Price inquiries
    if (messageLC.includes('price') || messageLC.includes('cost') || messageLC.includes('how much')) {
      if (matchedProducts.length > 0) {
        const product = matchedProducts[0];
        let response = `💰 **${product.name}** is priced at **${product.formattedPrice}**\n\n`;
        
        if (product.description) {
          response += `📝 **Description:** ${product.description}\n\n`;
        }
        
        response += `✅ **Status:** ${product.status}\n`;
        response += `👤 **Seller:** ${product.author.name}\n`;
        
        if (product.location.address) {
          response += `📍 **Location:** ${product.location.address}\n`;
        }
        
        // Suggest related products
        const categoryProducts = productCategories[product.category.toLowerCase()] || [];
        const relatedProducts = categoryProducts
          .filter(p => p.id !== product.id)
          .slice(0, 2);
        
        if (relatedProducts.length > 0) {
          response += `\n🔍 **Similar products:**\n`;
          relatedProducts.forEach(related => {
            response += `• ${related.name} - ${related.formattedPrice} (by ${related.author.name})\n`;
          });
        }
        
        response += `\n💬 Would you like more details about this product?`;
        return response;
      } else {
        // Category-based pricing
        const categories = Object.keys(productCategories);
        const matchedCategory = categories.find(cat => messageLC.includes(cat));
        
        if (matchedCategory) {
          const categoryProducts = productCategories[matchedCategory];
          const prices = categoryProducts.map(p => p.price).sort((a, b) => a - b);
          const minPrice = prices[0];
          const maxPrice = prices[prices.length - 1];
          
          let response = `💰 **${matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)} Pricing:**\n\n`;
          response += `• **Price range:** ${minPrice} - ${maxPrice} Rwf\n`;
          response += `• **Available products:** ${categoryProducts.length} items\n\n`;
          
          response += `🏆 **Featured products in ${matchedCategory}:**\n`;
          categoryProducts.slice(0, 3).forEach(product => {
            response += `• ${product.name} - ${product.formattedPrice} (${product.author.name})\n`;
          });
          
          return response;
        }
      }
    }
    
    // Product recommendations
    if (messageLC.includes('recommend') || messageLC.includes('suggest') || messageLC.includes('best')) {
      const categories = Object.keys(productCategories);
      const matchedCategory = categories.find(cat => messageLC.includes(cat));
      
      if (matchedCategory) {
        const categoryProducts = productCategories[matchedCategory]
          .filter(p => p.inStock)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        
        let response = `🌟 **Top ${matchedCategory} recommendations:**\n\n`;
        
        categoryProducts.forEach((product, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          response += `${medal} **${product.name}**\n`;
          response += `   💰 ${product.formattedPrice}\n`;
          response += `   👤 Seller: ${product.author.name}\n`;
          response += `   📝 ${product.description.substring(0, 80)}...\n\n`;
        });
        
        response += `✨ These are some of our most popular ${matchedCategory} items!`;
        return response;
      } else {
        // General recommendations
        const recentProducts = allProducts
          .filter(p => p.inStock)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        let response = `🌟 **Our latest marketplace additions:**\n\n`;
        recentProducts.forEach(product => {
          response += `• **${product.name}** - ${product.formattedPrice}\n`;
          response += `  Category: ${product.category} | Seller: ${product.author.name}\n\n`;
        });
        
        return response;
      }
    }
    
    // Availability inquiries
    if (messageLC.includes('available') || messageLC.includes('in stock') || messageLC.includes('stock')) {
      if (matchedProducts.length > 0) {
        let response = `📦 **Availability Information:**\n\n`;
        
        matchedProducts.slice(0, 5).forEach(product => {
          const statusIcon = product.inStock ? '✅' : '❌';
          response += `${statusIcon} **${product.name}** - ${product.status}\n`;
          response += `   👤 ${product.author.name} | 💰 ${product.formattedPrice}\n\n`;
        });
        
        return response;
      }
    }
    
    // Category browsing
    if (messageLC.includes('category') || messageLC.includes('categories') || messageLC.includes('browse')) {
      let response = `🗂️ **Browse our marketplace categories:**\n\n`;
      
      Object.keys(productCategories).forEach(category => {
        const count = productCategories[category].length;
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        response += `📁 **${categoryName}** (${count} products)\n`;
      });
      
      response += `\n💬 Just ask about any category to see what's available!`;
      return response;
    }
    
    // Seller inquiries
    if (messageLC.includes('seller') || messageLC.includes('who sells') || messageLC.includes('sold by')) {
      if (matchedProducts.length > 0) {
        const product = matchedProducts[0];
        let response = `👤 **Seller Information:**\n\n`;
        response += `**${product.name}** is sold by **${product.author.name}**\n\n`;
        
        if (product.location.address) {
          response += `📍 **Location:** ${product.location.address}\n`;
        }
        
        // Find other products by same seller
        const sellerProducts = allProducts.filter(p => 
          p.author.id === product.author.id && p.id !== product.id
        ).slice(0, 3);
        
        if (sellerProducts.length > 0) {
          response += `\n🛍️ **Other products by ${product.author.name}:**\n`;
          sellerProducts.forEach(p => {
            response += `• ${p.name} - ${p.formattedPrice}\n`;
          });
        }
        
        return response;
      }
    }
    
    // Default response with product suggestions
    if (matchedProducts.length > 0) {
      const product = matchedProducts[0];
      let response = `Found "${product.name}" in our marketplace!\n\n`;
      response += `💰 **Price:** ${product.formattedPrice}\n`;
      response += `📝 **Details:** ${product.description}\n`;
      response += `👤 **Seller:** ${product.author.name}\n`;
      response += `📦 **Status:** ${product.status}\n`;
      
      if (product.location.address) {
        response += `📍 **Location:** ${product.location.address}\n`;
      }
      
      response += `\nWould you like to see more products like this?`;
      return response;
    }
    
    // No matches found
    const availableCategories = Object.keys(productCategories);
    let response = `I'd love to help you find what you're looking for! 🔍\n\n`;
    response += `🛍️ **Our marketplace offers:**\n`;
    availableCategories.forEach(category => {
      const count = productCategories[category].length;
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      response += `• ${categoryName} (${count} products)\n`;
    });
    response += `\n💬 Try asking about specific products, categories, or prices!`;
    
    return response;
  };

  const handleSend = async () => {
    if (inputValue.trim() === "") return;
    
    const userMessage = inputValue;
    const updatedMessages = [
      ...messages,
      { text: userMessage, sender: "user" }
    ];
    
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Generate intelligent response
      const aiResponse = generateIntelligentResponse(userMessage);
      
      setTimeout(() => {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: aiResponse, sender: "bot" }
        ]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `I apologize for the technical difficulty. Please try browsing our marketplace directly or contact our support team.`, sender: "bot" }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none transition-all duration-300 transform hover:scale-110"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </button>
      
      {/* Chatbot Dialog */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">🛍️</span>
              </div>
              <div>
                <h3 className="font-medium">Marketplace Assistant</h3>
                <p className="text-blue-100 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Online • {allProducts.length} products available
                </p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-96 space-y-3">
            {!isProductsLoaded && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
                  Loading marketplace products... 🔄
                </div>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-xs p-3 rounded-lg whitespace-pre-line ${
                    msg.sender === "user" 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none shadow-md" 
                      : "bg-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2 items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    <span className="text-sm text-gray-600 ml-2">Searching...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Action Buttons */}
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-200 bg-gray-50">
            {isProductsLoaded && Object.keys(productCategories).length > 0 ? (
              <>
                {Object.keys(productCategories).slice(0, 2).map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setInputValue(`Show me ${category} products`);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setInputValue("What are the latest products?");
                  }}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                >
                  🆕 Latest
                </button>
                <button
                  onClick={() => {
                    setInputValue("Browse categories");
                  }}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                >
                  📁 Categories
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500">Loading suggestions...</div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="border-t p-3 flex bg-white">
            <input
              type="text"
              placeholder="Ask about products, prices, or categories..."
              className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-r-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
              disabled={isLoading || inputValue.trim() === ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;