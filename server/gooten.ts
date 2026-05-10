import { log } from './vite';
import axios from 'axios';

// Initialize the Gooten client with credentials
const GOOTEN_API_KEY = process.env.GOOTEN_API_KEY || '';
const GOOTEN_PARTNER_ID = process.env.GOOTEN_PARTNER_ID || '';
const GOOTEN_RECIPE_ID = process.env.GOOTEN_RECIPE_ID || '';
const GOOTEN_PARTNER_BILLING_KEY = process.env.GOOTEN_PARTNER_BILLING_KEY || '';

if (!GOOTEN_RECIPE_ID) {
  console.error('Missing GOOTEN_RECIPE_ID environment variable');
}

if (!GOOTEN_PARTNER_BILLING_KEY) {
  console.error('Missing GOOTEN_PARTNER_BILLING_KEY environment variable');
}

log('Initializing Gooten API client', 'gooten');

// There are actually multiple Gooten APIs we need to work with:
// 1. Catalog API - just needs RecipeID
// 2. Product Templates API - needs RecipeID
// 3. Order API - needs RecipeID and PartnerBillingKey
// 4. Preview API - needs RecipeID and sometimes PartnerBillingKey

// Direct catalog access - doesn't require authentication
const GOOTEN_CATALOG_URL = 'https://gtnadminassets.blob.core.windows.net/productdatav3/catalog.json';

// Setup axios instance for Gooten API calls
const gootenApi = axios.create({
  baseURL: 'https://api.print.io/api/v/5',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add RecipeID to every request as required by Gooten API docs
gootenApi.interceptors.request.use((config) => {
  // Add RecipeID parameter to all requests - this is the only required parameter
  if (config.params) {
    config.params = { 
      ...config.params, 
      RecipeID: GOOTEN_RECIPE_ID
    };
  } else {
    config.params = { 
      RecipeID: GOOTEN_RECIPE_ID
    };
  }
  
  // Log the request for debugging
  console.log('Gooten API request:', { 
    url: config.url,
    params: config.params,
    method: config.method
  });
  
  return config;
});

// Get Gooten catalog data (directly from their catalog JSON - no auth needed)
export async function getGootenCatalog(): Promise<any> {
  try {
    const response = await axios.get(GOOTEN_CATALOG_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching Gooten catalog:', error);
    throw error;
  }
}

// Test connection to Gooten using the catalog endpoint that doesn't require authentication
export async function testGootenConnection(): Promise<{ success: boolean, message?: string, error?: any }> {
  try {
    // Try to access the catalog data which doesn't require authentication
    console.log('Testing Gooten connection with catalog URL:', GOOTEN_CATALOG_URL);
    const response = await axios.get(GOOTEN_CATALOG_URL);
    
    if (response.data && response.data['product-catalog']) {
      log('Gooten catalog access successful', 'gooten');
      const productCount = response.data['product-catalog'].reduce(
        (acc: number, category: any) => acc + (category.items?.length || 0), 
        0
      );
      return { 
        success: true, 
        message: `Connected to Gooten catalog successfully. Found ${productCount} products across multiple categories.` 
      };
    } else {
      return { 
        success: false, 
        message: 'Unexpected response format from Gooten catalog API' 
      };
    }
  } catch (error: any) {
    console.error('Gooten connection test failed:', error?.response?.data || error);
    
    let errorMessage = 'Connection to Gooten failed';
    
    // Check if there's a more specific error message from the API
    if (error?.response?.data?.ErrorMessage) {
      errorMessage += `: ${error.response.data.ErrorMessage}`;
    } else if (error?.message) {
      errorMessage += `: ${error.message}`;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error?.response?.data || error.message
    };
  }
}

// Get Gooten product categories
export async function getGootenProductCategories() {
  try {
    const response = await gootenApi.get('/source/productcategories');
    return response.data;
  } catch (error) {
    console.error('Error getting Gooten product categories:', error);
    throw error;
  }
}

// Get Gooten products
export async function getGootenProducts() {
  try {
    const response = await gootenApi.get('/source/products');
    return response.data;
  } catch (error) {
    console.error('Error getting Gooten products:', error);
    throw error;
  }
}

// Get detailed information about a specific Gooten product
export async function getGootenProductById(id: string) {
  try {
    const response = await gootenApi.get(`/source/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting Gooten product ${id}:`, error);
    throw error;
  }
}

// Get Gooten shipping options using the shippingprices endpoint
export async function getGootenShippingOptions(data: any) {
  try {
    log('Requesting Gooten shipping options', 'gooten');
    // The main endpoint for shipping prices/options
    const response = await gootenApi.post('/source/api/shippingprices', data);
    
    // Log sample of the response
    log(`Received shipping options response: ${JSON.stringify(response.data).substring(0, 200)}...`, 'gooten');
    
    return response.data;
  } catch (error) {
    console.error('Error getting Gooten shipping options:', error);
    throw error;
  }
}

// Validate a shipping address with Gooten
export async function validateGootenAddress(addressData: any) {
  try {
    log('Validating address with Gooten', 'gooten');
    // Using the correct API endpoint based on documentation
    const response = await gootenApi.post('/source/api/address/validate', addressData);
    
    log(`Address validation result: Valid=${response.data.IsValid}, Score=${response.data.Score}`, 'gooten');
    return response.data;
  } catch (error) {
    console.error('Error validating Gooten address:', error);
    throw error;
  }
}

// Get shipping price estimate for a product
export async function getGootenShippingEstimate(params: {
  productId: string | number,
  countryCode: string,
  currencyCode?: string
}) {
  try {
    log('Getting Gooten shipping estimate', 'gooten');
    
    // Build the query parameters
    const queryParams = {
      productId: params.productId,
      countryCode: params.countryCode
    };
    
    // Add optional currency code if provided
    if (params.currencyCode) {
      Object.assign(queryParams, { currencyCode: params.currencyCode });
    }
    
    const response = await gootenApi.get('/source/api/shippriceestimate', { 
      params: queryParams
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting Gooten shipping estimate:', error);
    throw error;
  }
}

// Import Gooten products to the local store using the catalog endpoint
export async function importGootenProducts(storage: any) {
  try {
    // Get products from Gooten catalog which doesn't require authentication
    const catalog = await getGootenCatalog();
    if (!catalog || !catalog['product-catalog']) {
      throw new Error('Invalid Gooten catalog format');
    }
    
    const importedProducts = [];
    let totalProductsFound = 0;
    
    // Process each category
    for (const category of catalog['product-catalog']) {
      if (!category.items || !Array.isArray(category.items)) {
        continue;
      }
      
      totalProductsFound += category.items.length;
      const categoryName = category.name || 'Merchandise';
      
      // Import each product in the category
      for (const item of category.items) {
        try {
          // Skip if missing required fields
          if (!item.name || !item.url) {
            continue;
          }
          
          // Extract price from the cheapest_price field (e.g., "$22.40" -> 22.40)
          let price = 29.99; // Default price
          if (item.cheapest_price) {
            const priceMatch = item.cheapest_price.match(/\$?(\d+\.\d+)/);
            if (priceMatch && priceMatch[1]) {
              price = parseFloat(priceMatch[1]);
            }
          }
          
          // Map Gooten product to our product schema
          const product = {
            title: item.name,
            description: item.meta_description || 'Print-on-demand product from Gooten',
            price: price,
            imageUrl: item.url, // Preview image URL
            available: !item.out_of_stock,
            featured: false,
            type: 'gooten', // Mark as Gooten product
            category: categoryName.toLowerCase().replace(/\s+/g, '-'),
            gootenProductId: item.product_id.toString(),
            stock: 999, // Print-on-demand products have unlimited stock
            createdAt: new Date().toISOString()
          };
          
          // Create or update product in local storage
          try {
            const existingProducts = await storage.getProductsByType('gooten');
            const existingProduct = existingProducts.find((p: any) => 
              p.gootenProductId === product.gootenProductId
            );
            
            if (existingProduct) {
              // Update existing product
              await storage.updateProduct(existingProduct.id, product);
              log(`Updated product: ${product.title}`, 'gooten');
              importedProducts.push(existingProduct.id);
            } else {
              // Create new product
              const newProduct = await storage.createProduct(product);
              log(`Imported new product: ${product.title}`, 'gooten');
              importedProducts.push(newProduct.id);
            }
          } catch (productError) {
            console.error(`Error saving product ${product.title}:`, productError);
          }
        } catch (itemError) {
          console.error(`Error processing product item:`, itemError);
        }
      }
    }
    
    log(`Found ${totalProductsFound} products in Gooten catalog, imported ${importedProducts.length}`, 'gooten');
    
    return { 
      count: importedProducts.length,
      productIds: importedProducts
    };
  } catch (error) {
    console.error('Error importing Gooten products:', error);
    throw error;
  }
}

// Create an order in Gooten
export async function createGootenOrder(orderData: any) {
  try {
    // Make sure the PartnerBillingKey is set from environment variable
    // This approach ensures we never use a hard-coded key
    if (orderData.Payment && !orderData.Payment.PartnerBillingKey) {
      orderData.Payment.PartnerBillingKey = GOOTEN_PARTNER_BILLING_KEY;
    } else if (!orderData.Payment) {
      orderData.Payment = {
        PartnerBillingKey: GOOTEN_PARTNER_BILLING_KEY
      };
    }
    
    // Make sure we don't log the full order data with sensitive info
    const orderDataForLogging = { ...orderData };
    if (orderDataForLogging.Payment) {
      orderDataForLogging.Payment = { 
        ...orderDataForLogging.Payment,
        PartnerBillingKey: '***REDACTED***' 
      };
    }
    log(`Creating Gooten order: ${JSON.stringify(orderDataForLogging)}`, 'gooten');
    
    const response = await gootenApi.post('/source/api/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating Gooten order:', error);
    throw error;
  }
}

// Process a webhook from Gooten for order status updates
export async function processGootenWebhook(webhookData: any) {
  try {
    log('Processing Gooten webhook', 'gooten');
    log(`Webhook data: ${JSON.stringify(webhookData)}`, 'gooten');
    
    // Webhook data structure from Gooten documentation:
    // {
    //   "OrderId": "string", // Order ID
    //   "SafeOrderId": "string", // Safe Order ID (used in API calls)
    //   "OrderStatusId": "integer", // Status ID
    //   "OrderStatusName": "string", // Status name
    //   "ItemId": "integer", // Item ID (if status change is for specific item)
    //   "ItemStatusId": "integer", // Item status ID
    //   "ItemStatusName": "string", // Item status name
    //   "NiceId": "string" // Nice ID for the order
    //   "TrackingNumber": "string", // Optional - tracking number when shipping
    //   "TrackingUrl": "string", // Optional - tracking URL when shipping
    //   "ShipCarrierName": "string" // Optional - carrier name when shipping
    // }
    
    // Check if webhook contains required data
    if (!webhookData.SafeOrderId) {
      throw new Error('Webhook missing required SafeOrderId');
    }
    
    // Process different types of webhook events
    if (webhookData.OrderStatusName) {
      // This is an order status update
      log(`Order ${webhookData.SafeOrderId} status changed to ${webhookData.OrderStatusName}`, 'gooten');
      
      // Map Gooten status to our system's status
      let newStatus: string;
      
      switch(webhookData.OrderStatusName.toLowerCase()) {
        case 'completed':
        case 'shipped':
        case 'readyforshipping':
          newStatus = 'shipped';
          break;
        case 'cancelled':
          newStatus = 'cancelled';
          break;
        case 'processing':
        case 'prepressprocessing':
        case 'production':
        case 'preproduction':
          newStatus = 'processing';
          break;
        case 'pendingapproval':
        case 'readyforapproval':
        case 'needsmanualapproval':
          newStatus = 'pending-approval';
          break;
        case 'addressissue':
        case 'paymentissue':
        case 'imageissue':
          newStatus = 'issue';
          break;
        default:
          newStatus = 'pending';
      }
      
      // If tracking information is provided, include it in the response
      const trackingInfo = webhookData.TrackingNumber ? {
        trackingNumber: webhookData.TrackingNumber,
        trackingUrl: webhookData.TrackingUrl || null,
        carrier: webhookData.ShipCarrierName || null
      } : null;
      
      return {
        success: true,
        orderId: webhookData.SafeOrderId,
        newStatus,
        trackingInfo,
        message: `Updated order ${webhookData.SafeOrderId} status to ${newStatus}`
      };
    } else if (webhookData.ItemStatusName && webhookData.ItemId) {
      // This is an item status update
      log(`Item ${webhookData.ItemId} for order ${webhookData.SafeOrderId} status changed to ${webhookData.ItemStatusName}`, 'gooten');
      
      // Map Gooten item status to our system's status
      let itemStatus: string;
      
      switch(webhookData.ItemStatusName.toLowerCase()) {
        case 'completed':
        case 'shipped':
          itemStatus = 'shipped';
          break;
        case 'cancelled':
          itemStatus = 'cancelled';
          break;
        case 'processing':
        case 'prepressprocessing':
          itemStatus = 'processing';
          break;
        default:
          itemStatus = 'pending';
      }
      
      // If tracking information is provided, include it in the response
      const trackingInfo = webhookData.TrackingNumber ? {
        trackingNumber: webhookData.TrackingNumber,
        trackingUrl: webhookData.TrackingUrl || null,
        carrier: webhookData.ShipCarrierName || null
      } : null;
      
      return {
        success: true,
        orderId: webhookData.SafeOrderId,
        itemId: webhookData.ItemId,
        itemStatus,
        trackingInfo,
        message: `Received item status update for order ${webhookData.SafeOrderId}`
      };
    }
    
    return {
      success: false,
      message: 'Unknown webhook event type'
    };
  } catch (error) {
    console.error('Error processing Gooten webhook:', error);
    throw error;
  }
}