/**
 * Centralized API Configuration Manager
 * Implements secure key management and validation from external review recommendations
 */

import { db } from "../db";
import { apiConfigurations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { recommendationCache } from "./memory-optimizer";

interface APIConfig {
  key: string;
  value: string;
  service: string;
  isActive: boolean;
  environment: string;
}

class APIConfigManager {
  private cache = new Map<string, string>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Get API configuration value with caching and validation
   */
  async getConfig(key: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      // Fetch from database
      const [config] = await db
        .select()
        .from(apiConfigurations)
        .where(eq(apiConfigurations.key, key))
        .limit(1);

      if (!config) {
        console.warn(`⚠️ API Config not found: ${key}`);
        return null;
      }

      if (!config.isActive) {
        console.warn(`⚠️ API Config inactive: ${key}`);
        return null;
      }

      // Cache the result
      this.cache.set(key, config.value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

      return config.value;
    } catch (error) {
      console.error(`❌ Error fetching API config ${key}:`, error);
      return null;
    }
  }

  /**
   * Set or update API configuration
   */
  async setConfig(key: string, value: string, service: string, environment = 'production'): Promise<boolean> {
    try {
      await db
        .insert(apiConfigurations)
        .values({
          key,
          value,
          service,
          environment,
          isActive: true,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: apiConfigurations.key,
          set: {
            value,
            service,
            environment,
            isActive: true,
            updatedAt: new Date()
          }
        });

      // Update cache
      this.cache.set(key, value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

      console.log(`✅ API Config updated: ${key} for ${service}`);
      return true;
    } catch (error) {
      console.error(`❌ Error setting API config ${key}:`, error);
      return false;
    }
  }

  /**
   * Validate API key format and basic requirements
   */
  validateAPIKey(service: string, key: string): { valid: boolean; message?: string } {
    const validations: Record<string, (key: string) => boolean> = {
      stripe: (k) => k.startsWith('sk_') && k.length > 20,
      printful: (k) => k.length > 10,
      gooten: (k) => k.length > 10,
      sendgrid: (k) => k.startsWith('SG.') && k.length > 20,
      mailgun: (k) => k.length > 10,
      openai: (k) => k.startsWith('sk-') && k.length > 20
    };

    const validator = validations[service.toLowerCase()];
    if (!validator) {
      return { valid: false, message: `Unknown service: ${service}` };
    }

    if (!validator(key)) {
      return { valid: false, message: `Invalid ${service} API key format` };
    }

    return { valid: true };
  }

  /**
   * Get all configurations for a service
   */
  async getServiceConfigs(service: string): Promise<APIConfig[]> {
    try {
      const configs = await db
        .select()
        .from(apiConfigurations)
        .where(eq(apiConfigurations.service, service));

      return configs.map(config => ({
        key: config.key,
        value: config.value,
        service: config.service,
        isActive: config.isActive,
        environment: config.environment
      }));
    } catch (error) {
      console.error(`❌ Error fetching service configs for ${service}:`, error);
      return [];
    }
  }

  /**
   * Invalidate cache for a specific key or all keys
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

  /**
   * Health check for all configured APIs
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const services = ['stripe', 'printful', 'gooten', 'sendgrid'];
    const results: Record<string, boolean> = {};

    for (const service of services) {
      const config = await this.getConfig(`${service}ApiKey`);
      results[service] = !!config;
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expiries: Array.from(this.cacheExpiry.entries()).map(([key, expiry]) => ({
        key,
        expiresAt: new Date(expiry),
        expiresIn: Math.max(0, expiry - Date.now())
      }))
    };
  }
}

// Singleton instance
export const apiConfigManager = new APIConfigManager();

/**
 * Helper functions for common API configurations
 */
export async function getStripeConfig() {
  return {
    secretKey: await apiConfigManager.getConfig('stripeSecretKey'),
    publishableKey: await apiConfigManager.getConfig('stripePublishableKey'),
    webhookSecret: await apiConfigManager.getConfig('stripeWebhookSecret')
  };
}

export async function getPrintfulConfig() {
  return {
    apiKey: await apiConfigManager.getConfig('printfulApiKey'),
    storeId: await apiConfigManager.getConfig('printfulStoreId')
  };
}

export async function getGootenConfig() {
  return {
    apiKey: await apiConfigManager.getConfig('gootenApiKey'),
    recipeId: await apiConfigManager.getConfig('gootenRecipeId')
  };
}

export async function getEmailConfig() {
  return {
    sendgridApiKey: await apiConfigManager.getConfig('sendgridApiKey'),
    mailgunApiKey: await apiConfigManager.getConfig('mailgunApiKey'),
    mailgunDomain: await apiConfigManager.getConfig('mailgunDomain')
  };
}