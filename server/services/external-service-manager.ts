/**
 * Centralized External Service Manager
 * Dynamically configures all third-party services using database-stored API keys
 */

import { storage } from "../storage";
import { validateEncryptionSetup } from "../utils/encryption";

interface ServiceConfig {
  name: string;
  keys: string[];
  initialized: boolean;
  lastError?: string;
}

export class ExternalServiceManager {
  private services: Map<string, ServiceConfig> = new Map();
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.initializeServiceDefinitions();
  }

  private initializeServiceDefinitions() {
    // Define all external services and their required API keys
    this.services.set('stripe', {
      name: 'Stripe Payment Processing',
      keys: ['stripe_secret_key', 'stripe_public_key'],
      initialized: false
    });

    this.services.set('printful', {
      name: 'Printful Print-on-Demand',
      keys: ['printful_api_key'],
      initialized: false
    });

    this.services.set('gooten', {
      name: 'Gooten Print Services',
      keys: ['gooten_partner_billing_key'],
      initialized: false
    });

    this.services.set('usps', {
      name: 'USPS Shipping',
      keys: ['usps_consumer_key', 'usps_consumer_secret'],
      initialized: false
    });

    this.services.set('ups', {
      name: 'UPS Shipping',
      keys: ['ups_access_key', 'ups_username', 'ups_password'],
      initialized: false
    });

    this.services.set('fedex', {
      name: 'FedEx Shipping',
      keys: ['fedex_account_number', 'fedex_meter_number', 'fedex_key', 'fedex_password'],
      initialized: false
    });

    this.services.set('sendgrid', {
      name: 'SendGrid Email Service',
      keys: ['sendgrid_api_key'],
      initialized: false
    });

    this.services.set('cloudinary', {
      name: 'Cloudinary Media Storage',
      keys: ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret'],
      initialized: false
    });

    this.services.set('google_analytics', {
      name: 'Google Analytics',
      keys: ['google_analytics_measurement_id'],
      initialized: false
    });
  }

  /**
   * Get API key for a specific service
   */
  async getApiKey(key: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      const expiry = this.cacheExpiry.get(key);
      
      if (cached && expiry && Date.now() < expiry) {
        return cached;
      }

      // Fetch from database (automatically decrypted)
      const config = await storage.getApiConfig(key);
      if (!config || !config.value) {
        console.warn(`⚠️ API key not found or empty: ${key}`);
        return null;
      }

      // Cache the result
      this.cache.set(key, config.value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

      return config.value;
    } catch (error) {
      console.error(`❌ Error fetching API key ${key}:`, error);
      return null;
    }
  }

  /**
   * Initialize a specific service with dynamic configuration
   */
  async initializeService(serviceName: string): Promise<boolean> {
    try {
      const serviceConfig = this.services.get(serviceName);
      if (!serviceConfig) {
        console.error(`❌ Unknown service: ${serviceName}`);
        return false;
      }

      console.log(`🔧 Initializing ${serviceConfig.name}...`);

      // Check if all required keys are available
      const keys: Record<string, string> = {};
      for (const keyName of serviceConfig.keys) {
        const value = await this.getApiKey(keyName);
        if (!value) {
          console.warn(`⚠️ Missing API key for ${serviceName}: ${keyName}`);
          serviceConfig.initialized = false;
          serviceConfig.lastError = `Missing required key: ${keyName}`;
          return false;
        }
        keys[keyName] = value;
      }

      // Service-specific initialization logic
      switch (serviceName) {
        case 'stripe':
          await this.initializeStripe(keys);
          break;
        case 'printful':
          await this.initializePrintful(keys);
          break;
        case 'gooten':
          await this.initializeGooten(keys);
          break;
        case 'sendgrid':
          await this.initializeSendGrid(keys);
          break;
        case 'cloudinary':
          await this.initializeCloudinary(keys);
          break;
        case 'google_analytics':
          await this.initializeGoogleAnalytics(keys);
          break;
        default:
          console.log(`ℹ️ No specific initialization for ${serviceName}`);
      }

      serviceConfig.initialized = true;
      serviceConfig.lastError = undefined;
      console.log(`✅ ${serviceConfig.name} initialized successfully`);
      return true;

    } catch (error) {
      const serviceConfig = this.services.get(serviceName);
      if (serviceConfig) {
        serviceConfig.initialized = false;
        serviceConfig.lastError = error instanceof Error ? error.message : 'Unknown error';
      }
      console.error(`❌ Failed to initialize ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Initialize all services
   */
  async initializeAllServices(): Promise<void> {
    console.log('🚀 Initializing all external services...');
    
    // Validate encryption setup first
    const encryptionCheck = validateEncryptionSetup();
    if (!encryptionCheck.valid) {
      console.error('❌ Encryption setup invalid:', encryptionCheck.error);
      throw new Error(`Encryption validation failed: ${encryptionCheck.error}`);
    }

    const promises = Array.from(this.services.keys()).map(serviceName => 
      this.initializeService(serviceName)
    );

    await Promise.all(promises);
    console.log('✅ Service initialization complete');
  }

  /**
   * Get service status for admin dashboard
   */
  getServiceStatus(): Record<string, { name: string; initialized: boolean; lastError?: string }> {
    const status: Record<string, { name: string; initialized: boolean; lastError?: string }> = {};
    
    for (const [key, config] of this.services) {
      status[key] = {
        name: config.name,
        initialized: config.initialized,
        lastError: config.lastError
      };
    }
    
    return status;
  }

  /**
   * Invalidate cache when API keys are updated
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Service-specific initialization methods
  private async initializeStripe(keys: Record<string, string>): Promise<void> {
    console.log('💳 Stripe credentials loaded from database');
  }

  private async initializePrintful(keys: Record<string, string>): Promise<void> {
    console.log('🖨️ Printful API key loaded from database');
  }

  private async initializeGooten(keys: Record<string, string>): Promise<void> {
    console.log('📦 Gooten credentials loaded from database');
  }

  private async initializeSendGrid(keys: Record<string, string>): Promise<void> {
    console.log('📧 SendGrid API key loaded from database');
  }

  private async initializeCloudinary(keys: Record<string, string>): Promise<void> {
    console.log('☁️ Cloudinary credentials loaded from database');
  }

  private async initializeGoogleAnalytics(keys: Record<string, string>): Promise<void> {
    console.log('📊 Google Analytics measurement ID loaded from database');
  }
}

// Singleton instance
export const serviceManager = new ExternalServiceManager();