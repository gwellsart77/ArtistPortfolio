// Centralized API Configuration Management
// This replaces environment variables with database-stored API keys

import { storage } from "./storage";

interface ApiConfig {
  // Payment Processing
  stripeSecretKey?: string;
  stripePublicKey?: string;
  
  // Print-on-Demand Services
  printfulApiKey?: string;
  gootenPartnerBillingKey?: string;
  
  // Shipping Services
  uspsConsumerKey?: string;
  uspsConsumerSecret?: string;
  fedexAccountNumber?: string;
  fedexMeterNumber?: string;
  fedexKey?: string;
  fedexPassword?: string;
  upsAccessKey?: string;
  upsUsername?: string;
  upsPassword?: string;
  shipstationApiKey?: string;
  shipstationApiSecret?: string;
  
  // Email Services
  sendgridApiKey?: string;
  
  // Cloud Services
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  
  // Analytics
  googleAnalyticsMeasurementId?: string;
}

class ApiConfigManager {
  private cache: ApiConfig = {};
  private lastCacheUpdate = 0;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async getConfig(): Promise<ApiConfig> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      await this.refreshCache();
    }
    return this.cache;
  }

  async refreshCache(): Promise<void> {
    try {
      // Load all API configurations from database
      const configs = await storage.getAllApiConfigs();
      this.cache = {};
      
      configs.forEach(config => {
        this.cache[config.key as keyof ApiConfig] = config.value;
      });
      
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Failed to refresh API config cache:', error);
    }
  }

  async getApiKey(key: keyof ApiConfig): Promise<string | undefined> {
    const config = await this.getConfig();
    return config[key];
  }

  async setApiKey(key: keyof ApiConfig, value: string): Promise<void> {
    await storage.setApiConfig(key, value);
    await this.refreshCache();
  }

  async testConnection(service: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    
    switch (service) {
      case 'stripe':
        return this.testStripe(config.stripeSecretKey);
      case 'printful':
        return this.testPrintful(config.printfulApiKey);
      case 'gooten':
        return this.testGooten(config.gootenPartnerBillingKey);
      case 'sendgrid':
        return this.testSendGrid(config.sendgridApiKey);
      case 'usps':
        return this.testUSPS(config.uspsConsumerKey, config.uspsConsumerSecret);
      case 'cloudinary':
        return this.testCloudinary(config.cloudinaryCloudName, config.cloudinaryApiKey, config.cloudinaryApiSecret);
      default:
        return { success: false, message: 'Unknown service' };
    }
  }

  private async testStripe(apiKey?: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'Stripe API key not configured' };
    }
    
    try {
      const stripe = new (await import('stripe')).default(apiKey, { apiVersion: "2023-10-16" });
      await stripe.balance.retrieve();
      return { success: true, message: 'Stripe connection successful' };
    } catch (error) {
      return { success: false, message: 'Stripe connection failed' };
    }
  }

  private async testPrintful(apiKey?: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'Printful API key not configured' };
    }
    
    try {
      const response = await fetch('https://api.printful.com/stores', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        return { success: true, message: 'Printful connection successful' };
      } else {
        return { success: false, message: 'Printful authentication failed' };
      }
    } catch (error) {
      return { success: false, message: 'Printful connection failed' };
    }
  }

  private async testGooten(apiKey?: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'Gooten API key not configured' };
    }
    
    try {
      const response = await fetch('https://api.gooten.com/v1/productcategories/', {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { success: true, message: 'Gooten connection successful' };
      } else {
        return { success: false, message: 'Gooten authentication failed' };
      }
    } catch (error) {
      return { success: false, message: 'Gooten connection failed' };
    }
  }

  private async testSendGrid(apiKey?: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey) {
      return { success: false, message: 'SendGrid API key not configured' };
    }
    
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        return { success: true, message: 'SendGrid connection successful' };
      } else {
        return { success: false, message: 'SendGrid authentication failed' };
      }
    } catch (error) {
      return { success: false, message: 'SendGrid connection failed' };
    }
  }

  private async testUSPS(consumerKey?: string, consumerSecret?: string): Promise<{ success: boolean; message: string }> {
    if (!consumerKey || !consumerSecret) {
      return { success: false, message: 'USPS credentials not configured' };
    }
    
    // USPS requires OAuth token generation for testing
    try {
      const authResponse = await fetch('https://api.usps.com/oauth2/v3/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: consumerKey,
          client_secret: consumerSecret,
          grant_type: 'client_credentials'
        })
      });
      
      if (authResponse.ok) {
        return { success: true, message: 'USPS connection successful' };
      } else {
        return { success: false, message: 'USPS authentication failed' };
      }
    } catch (error) {
      return { success: false, message: 'USPS connection failed' };
    }
  }

  private async testCloudinary(cloudName?: string, apiKey?: string, apiSecret?: string): Promise<{ success: boolean; message: string }> {
    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, message: 'Cloudinary credentials not configured' };
    }
    
    try {
      const cloudinary = await import('cloudinary');
      cloudinary.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
      });
      
      const result = await cloudinary.v2.api.ping();
      if (result.status === 'ok') {
        return { success: true, message: 'Cloudinary connection successful' };
      } else {
        return { success: false, message: 'Cloudinary connection failed' };
      }
    } catch (error) {
      return { success: false, message: 'Cloudinary connection failed' };
    }
  }
}

export const apiConfig = new ApiConfigManager();