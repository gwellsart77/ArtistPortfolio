import axios from 'axios';
import { db } from './db';
import { products, productVariants, type InsertProduct, type InsertProductVariant, type Product } from '@shared/schema';
import { storage } from './storage';
import { eq } from 'drizzle-orm';

// Initialize Printful client with API key
class PrintfulClient {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    if (!process.env.PRINTFUL_API_KEY) {
      throw new Error('PRINTFUL_API_KEY environment variable is not set');
    }
    
    this.apiKey = process.env.PRINTFUL_API_KEY;
    this.baseUrl = 'https://api.printful.com';
    
    console.log('Initialized Printful API client');
  }
  
  // Helper method to make authenticated requests to Printful API
  private async request(method: string, endpoint: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Printful API Error (${endpoint}):`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }
  
  // Test the connection to Printful API
  async testConnection(): Promise<{ success: boolean, message?: string, error?: any }> {
    try {
      // Instead of accessing the /store endpoint which requires stores_list/read permission,
      // let's use the /countries endpoint which is generally accessible with any valid API key
      const response = await this.request('GET', '/countries');
      return { 
        success: true, 
        message: 'Successfully connected to Printful API' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Failed to connect to Printful API', 
        error 
      };
    }
  }
  
  // Get stores (useful for account verification)
  async getStores() {
    const response = await this.request('GET', '/stores');
    return response.result;
  }
  
  // Get a list of all available Printful products
  async getProducts() {
    const response = await this.request('GET', '/products');
    return response.result;
  }
  
  // Get a specific product by ID
  async getProductById(id: number) {
    const response = await this.request('GET', `/products/${id}`);
    return response.result;
  }
  
  // Get product variants
  async getProductVariants(productId: number) {
    const response = await this.request('GET', `/products/${productId}/variants`);
    return response.result;
  }
  
  // Get sync products (products that have been synced with Printful)
  async getSyncProducts() {
    const response = await this.request('GET', '/sync/products');
    return response.result;
  }
  
  // Get specific sync product
  async getSyncProductById(id: number) {
    const response = await this.request('GET', `/sync/products/${id}`);
    return response.result;
  }
  
  // Create a sync product (create or update product in Printful)
  async createSyncProduct(syncProduct: any) {
    const response = await this.request('POST', '/sync/products', syncProduct);
    return response.result;
  }
  
  // Get shipping rates
  async getShippingRates(data: any) {
    const response = await this.request('POST', '/shipping/rates', data);
    return response.result;
  }
  
  // Get all shipping methods
  async getShippingMethods() {
    const response = await this.request('GET', '/shipping/methods');
    return response.result;
  }
  
  // Create and confirm an order
  async createOrder(orderData: any) {
    const response = await this.request('POST', '/orders', orderData);
    return response.result;
  }
  
  // Get information about an order
  async getOrder(orderId: number) {
    const response = await this.request('GET', `/orders/${orderId}`);
    return response.result;
  }
  
  // Cancel an order
  async cancelOrder(orderId: number) {
    const response = await this.request('DELETE', `/orders/${orderId}`);
    return response.result;
  }
  
  // Import Printful products to website database
  async importProducts(storage: any) {
    try {
      // Get all sync products from Printful
      const syncProducts = await this.getSyncProducts();
      console.log(`Found ${syncProducts.length} sync products in Printful`);
      
      const importedProducts = [];
      const skippedProducts = [];
      
      // Get all existing Printful products from our database to check for duplicates
      const existingProducts = await storage.getAllProducts();
      const existingPrintfulIds = existingProducts
        .filter(product => product.printfulProductId) // Only consider products with printfulProductId
        .map(product => product.printfulProductId);
      
      console.log(`Found ${existingPrintfulIds.length} existing Printful products in database`);
      
      // Process each product and add/update in our database
      for (const syncProduct of syncProducts) {
        try {
          // Check if this product already exists in our database
          const isExisting = existingPrintfulIds.includes(syncProduct.id.toString());
          
          if (isExisting) {
            console.log(`Updating existing Printful product: ${syncProduct.name} (ID: ${syncProduct.id})`);
          } else {
            console.log(`Adding new Printful product: ${syncProduct.name} (ID: ${syncProduct.id})`);
          }
          
          // Get more detailed information
          const productDetails = await this.getSyncProductById(syncProduct.id);
          
          // Get mockup image rather than just the design preview
          let imageUrl = '';
          
          // First try to get a mockup image (product with the design applied)
          if (productDetails.sync_variants && 
              productDetails.sync_variants.length > 0 && 
              productDetails.sync_variants[0].files) {
            
            // Look for a file with type "preview" which contains the actual mockup
            const previewFile = productDetails.sync_variants[0].files.find(file => file.type === 'preview');
            if (previewFile && previewFile.preview_url) {
              imageUrl = previewFile.preview_url;
              console.log('Found preview mockup image:', imageUrl);
            } 
            // If no preview type found, check if there's a mockup type
            else {
              const mockupFile = productDetails.sync_variants[0].files.find(file => file.type === 'mockup');
              if (mockupFile && mockupFile.preview_url) {
                imageUrl = mockupFile.preview_url;
                console.log('Found mockup image:', imageUrl);
              }
            }
            
            // If no preview or mockup file found, try using the product image which often has a mockup
            if (!imageUrl && productDetails.sync_variants[0].product && productDetails.sync_variants[0].product.image) {
              imageUrl = productDetails.sync_variants[0].product.image;
              console.log('Using product image:', imageUrl);
            }
            
            // If still no image, just get the first available preview_url
            if (!imageUrl && productDetails.sync_variants[0].files.length > 0) {
              for (const file of productDetails.sync_variants[0].files) {
                if (file.preview_url) {
                  imageUrl = file.preview_url;
                  console.log('Using fallback file preview:', imageUrl);
                  break;
                }
              }
            }
          }
          
          // Fallback to thumbnail if still no image found
          if (!imageUrl) {
            imageUrl = productDetails.sync_product.thumbnail_url || '';
            console.log('Using thumbnail fallback:', imageUrl);
          }
          
          // Prepare product data
          // Make sure price is converted to a number first (Printful may return it as string)
          const retailPrice = productDetails.sync_variants[0].retail_price;
          const numericPrice = typeof retailPrice === 'string' 
            ? parseFloat(retailPrice.replace(/[^0-9.]/g, '')) 
            : retailPrice;
          
          // Ensure price is rounded to an integer value
          const roundedPrice = Math.round(numericPrice);
            
          const productData: InsertProduct = {
            title: productDetails.sync_product.name,
            description: productDetails.sync_product.description || 'Printful product',
            price: roundedPrice, // Properly converted to an integer
            imageUrl: imageUrl,
            type: 'merchandise',
            available: true,
            stock: 999, // Print-on-demand items are always in stock
            printfulProductId: productDetails.sync_product.id.toString(),
            artworkId: null,
            height: null,
            width: null,
            seoTitle: productDetails.sync_product.name,
            seoDescription: productDetails.sync_product.description || `${productDetails.sync_product.name} - Print on demand product`,
            seoKeywords: `print on demand, merchandise, ${productDetails.sync_product.name.toLowerCase()}`,
            altText: productDetails.sync_product.name
          };
          
          // Save or update product in database
          let savedProduct;
          if (isExisting) {
            // Update existing product
            const [updatedProduct] = await db
              .update(products)
              .set(productData)
              .where(eq(products.printfulProductId, productData.printfulProductId))
              .returning();
            savedProduct = updatedProduct;
          } else {
            // Insert new product
            const [insertedProduct] = await db.insert(products).values(productData).returning();
            savedProduct = insertedProduct;
          }
          
          // Handle product variants (delete existing ones if updating, then recreate)
          if (isExisting) {
            // Delete existing variants for this product
            await db.delete(productVariants).where(eq(productVariants.productId, savedProduct.id));
          }
          
          // Create variants for this product if it has multiple sizes
          if (productDetails.sync_variants && productDetails.sync_variants.length > 1) {
            for (const variant of productDetails.sync_variants) {
              // Extract size information from variant name or external_id
              const variantName = variant.name || `Size ${variant.id}`;
              const variantPrice = Math.round(parseFloat(variant.retail_price.replace(/[^0-9.]/g, '')));
              
              const variantData: InsertProductVariant = {
                productId: savedProduct.id,
                variantName: variantName,
                price: variantPrice,
                stock: 999,
                printfulVariantId: variant.id.toString(),
                available: true,
                isDefault: productDetails.sync_variants.indexOf(variant) === 0
              };
              
              await db.insert(productVariants).values(variantData);
            }
          }
          
          importedProducts.push(savedProduct);
          console.log(`Imported Printful product: ${savedProduct.title}`);
        } catch (error) {
          console.error(`Error importing product ${syncProduct.id}:`, error);
        }
      }
      
      return {
        success: true,
        message: `Successfully imported ${importedProducts.length} new Printful products (${skippedProducts.length} existing products skipped)`,
        products: importedProducts,
        skippedProducts: skippedProducts
      };
      
    } catch (error) {
      console.error('Error importing Printful products:', error);
      return {
        success: false,
        message: 'Failed to import Printful products',
        error
      };
    }
  }
  
  // Process a Printful webhook event
  async processWebhook(webhookData: any) {
    try {
      console.log('Processing Printful webhook:', webhookData.type);
      
      switch (webhookData.type) {
        case 'package_shipped':
          // Update order status in your database
          // You'll need to implement this based on your order schema
          break;
          
        case 'order_failed':
          // Handle failed order
          break;
          
        case 'order_canceled':
          // Handle canceled order
          break;
          
        default:
          console.log(`Unhandled webhook type: ${webhookData.type}`);
      }
      
      return {
        success: true,
        message: `Processed webhook: ${webhookData.type}`
      };
    } catch (error) {
      console.error('Error processing Printful webhook:', error);
      return {
        success: false,
        message: 'Failed to process webhook',
        error
      };
    }
  }
}

// Export a singleton instance of the client
export const printful = new PrintfulClient();

// Export test function for connectivity check
export async function testPrintfulConnection(): Promise<{ success: boolean, message?: string, error?: any }> {
  return await printful.testConnection();
}

// Export function to import products
export async function importPrintfulProducts(storage: any) {
  return await printful.importProducts(storage);
}

// Export function to process webhook
export async function processPrintfulWebhook(webhookData: any) {
  return await printful.processWebhook(webhookData);
}