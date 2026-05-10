// Diagnostic #1: Verify this file is actually loading
console.log('*** LOADED MFA STORAGE FILE ***', import.meta.url, new Date().toISOString());

import {
  User,
  InsertUser,
  TrustedDevice,
  InsertTrustedDevice,
  Artwork,
  InsertArtwork,
  Product,
  InsertProduct,
  ProductVariant,
  InsertProductVariant,
  MerchandiseType,
  InsertMerchandiseType,
  OriginalType,
  InsertOriginalType,
  ContactMessage,
  InsertContactMessage,
  Subscriber,
  InsertSubscriber,
  Settings,
  InsertSettings,
  ShippingZone,
  InsertShippingZone,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  ApiConfiguration,
  InsertApiConfiguration,
  EmailTemplate,
  InsertEmailTemplate,
  users,
  trustedDevices,
  artworks,
  products,
  productVariants,
  merchandiseTypes,
  originalTypes,
  contactMessages,
  subscribers,
  settings,
  shippingZones,
  orders,
  orderItems,
  apiConfigurations,
  emailTemplates
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import { encryptApiKey, decryptApiKey, migrateToEncrypted, isEncrypted } from "./utils/encryption";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Diagnostic #2: Verify this constructor is called
    console.log('🚨 DatabaseStorage CONSTRUCTOR CALLED:', new Date().toISOString());
  }

  // Helper methods for API key encryption/decryption
  private encryptApiValue(value: string): string {
    try {
      return encryptApiKey(value);
    } catch (error) {
      console.error('Failed to encrypt API value:', error);
      throw error;
    }
  }

  private decryptApiValue(encryptedValue: string): string {
    try {
      // If it's already plain text (during migration), return as-is
      if (!isEncrypted(encryptedValue)) {
        console.warn('Found unencrypted API value, migrating to encrypted format');
        return encryptedValue;
      }
      return decryptApiKey(encryptedValue);
    } catch (error) {
      console.error('Failed to decrypt API value:', error);
      // Return empty string to prevent app crash, but log the error
      return '';
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserMfaStatus(id: number, enabled: boolean, secret?: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        mfaEnabled: enabled, 
        mfaSecret: enabled ? (secret || null) : null 
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserCredentials(id: number, username: string, password: string): Promise<User | undefined> {
    // Check if username already exists (excluding the current user)
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    const userWithSameUsername = existingUsers.find(u => u.id !== id);
    if (userWithSameUsername) {
      throw new Error('Username already taken');
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ username, password })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Artwork methods
  async getAllArtworks(): Promise<Artwork[]> {
    return await db.select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      category: artworks.category,
      year: artworks.year,
      medium: artworks.medium,
      dimensions: artworks.dimensions,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      featured: artworks.featured,
      available: artworks.available,
      displayOrder: artworks.displayOrder,
      artistName: artworks.artistName,
      status: artworks.status,
      isLimitedEdition: artworks.isLimitedEdition,
      editionSize: artworks.editionSize,
      editionsSold: artworks.editionsSold,
      limitedEditionPrice: artworks.limitedEditionPrice,
      limitedEditionAvailable: artworks.limitedEditionAvailable,
      hasDigitalVersion: artworks.hasDigitalVersion,
      digitalFileUrl: artworks.digitalFileUrl,
      digitalPrice: artworks.digitalPrice,
      personalLicensePrice: artworks.personalLicensePrice,
      commercialLicensePrice: artworks.commercialLicensePrice,
      seoTitle: artworks.seoTitle,
      seoDescription: artworks.seoDescription,
      altText: artworks.altText,
      createdAt: artworks.createdAt
    }).from(artworks)
      .orderBy(asc(artworks.displayOrder), desc(artworks.createdAt));
  }

  async getArtworkById(id: number): Promise<Artwork | undefined> {
    const [artwork] = await db.select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      category: artworks.category,
      year: artworks.year,
      medium: artworks.medium,
      dimensions: artworks.dimensions,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      featured: artworks.featured,
      available: artworks.available,
      displayOrder: artworks.displayOrder,
      artistName: artworks.artistName,
      status: artworks.status,
      isLimitedEdition: artworks.isLimitedEdition,
      editionSize: artworks.editionSize,
      editionsSold: artworks.editionsSold,
      limitedEditionPrice: artworks.limitedEditionPrice,
      limitedEditionAvailable: artworks.limitedEditionAvailable,
      hasDigitalVersion: artworks.hasDigitalVersion,
      digitalFileUrl: artworks.digitalFileUrl,
      digitalPrice: artworks.digitalPrice,
      personalLicensePrice: artworks.personalLicensePrice,
      commercialLicensePrice: artworks.commercialLicensePrice,
      seoTitle: artworks.seoTitle,
      seoDescription: artworks.seoDescription,
      altText: artworks.altText,
      createdAt: artworks.createdAt
    }).from(artworks).where(eq(artworks.id, id));
    return artwork;
  }

  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    return await db
      .select()
      .from(artworks)
      .where(eq(artworks.category, category))
      .orderBy(asc(artworks.displayOrder), desc(artworks.createdAt));
  }

  async getFeaturedArtworks(): Promise<Artwork[]> {
    return await db
      .select()
      .from(artworks)
      .where(eq(artworks.featured, true))
      .orderBy(asc(artworks.displayOrder), desc(artworks.createdAt));
  }
  
  async updateArtworkOrder(id: number, displayOrder: number): Promise<Artwork | undefined> {
    const [updatedArtwork] = await db
      .update(artworks)
      .set({ displayOrder })
      .where(eq(artworks.id, id))
      .returning();
    
    return updatedArtwork;
  }
  
  async updateArtworkCategories(oldCategory: string, newCategory: string): Promise<number> {
    const result = await db
      .update(artworks)
      .set({ category: newCategory })
      .where(eq(artworks.category, oldCategory))
      .returning();
    
    return result.length;
  }

  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const [artwork] = await db.insert(artworks).values(insertArtwork).returning();
    return artwork;
  }
  
  async updateArtworkAvailability(id: number, available: boolean): Promise<Artwork | undefined> {
    const [updatedArtwork] = await db
      .update(artworks)
      .set({ available })
      .where(eq(artworks.id, id))
      .returning();
    
    return updatedArtwork;
  }
  
  async updateArtwork(id: number, artworkData: Partial<InsertArtwork>): Promise<Artwork | undefined> {
    console.log(`⭐ ARTWORK UPDATE START - ID: ${id}`, artworkData);
    
    // Always get the current artwork first
    const [existingArtwork] = await db
      .select()
      .from(artworks)
      .where(eq(artworks.id, id));
      
    console.log(`Current artwork state:`, existingArtwork);
    
    // Create a clean update object that explicitly sets both status and available fields
    let updateData: Record<string, any> = { ...artworkData };
    
    // Handle special case for status field to ensure proper synchronization
    if (artworkData.status === 'sold') {
      // Ensure available is explicitly set to false when status is 'sold'
      updateData.available = false;
      console.log("🔴 SOLD status detected - forcing available=false");
    } else if (artworkData.status === 'available') {
      // Ensure available is explicitly set to true when status is 'available'
      updateData.available = true;
      console.log("🟢 AVAILABLE status detected - forcing available=true");
    } else if (artworkData.status === 'unavailable') {
      // For unavailable artwork, ensure available is false
      updateData.available = false;
      console.log("🟡 UNAVAILABLE status detected - forcing available=false");
      
      // Make sure the price can be null for unavailable artwork
      if (!updateData.price && updateData.price !== 0) {
        // If price is empty or null, use the existing price or set to null
        updateData.price = existingArtwork.price || null;
      }
    }
    
    // If available flag is being set without status, set status accordingly
    if (artworkData.available !== undefined && artworkData.status === undefined) {
      // Be more explicit about setting status to 'unavailable' if we have that information
      if (existingArtwork.status === 'unavailable' && artworkData.available === false) {
        updateData.status = 'unavailable';
        console.log(`Preserving UNAVAILABLE status`);
      } else {
        updateData.status = artworkData.available ? 'available' : 'sold';
      }
      console.log(`Available flag set to ${artworkData.available} - setting status=${updateData.status}`);
    }
    
    console.log("🔄 Final artwork update data:", updateData);
    
    try {
      // Extract the updatedAt field if it exists (may not be present)
      const cleanUpdateData = { ...updateData };
      if ('updatedAt' in cleanUpdateData) {
        delete cleanUpdateData.updatedAt;
      }
      
      // Directly modify the timestamp column on the database
      const currentTimestamp = new Date();
      
      // Perform the update
      const [updatedArtwork] = await db
        .update(artworks)
        .set(cleanUpdateData)
        .where(eq(artworks.id, id))
        .returning();
      
      console.log("✅ UPDATED ARTWORK:", updatedArtwork);
      return updatedArtwork;
    } catch (error) {
      console.error("❌ ERROR updating artwork:", error);
      throw error;
    }
  }
  
  async deleteArtwork(id: number): Promise<boolean> {
    try {
      await db.delete(artworks).where(eq(artworks.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting artwork:", error);
      return false;
    }
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    try {
      console.log("Fetching all products from database");
      const result = await db.select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        type: products.type,
        subtype: products.subtype,
        available: products.available,
        stock: products.stock,
        artworkId: products.artworkId,
        printfulProductId: products.printfulProductId,
        isLimitedEdition: products.isLimitedEdition,
        editionSize: products.editionSize,
        editionNumber: products.editionNumber,
        category: products.category,
        featured: products.featured,
        displayOrder: products.displayOrder,
        height: products.height,
        width: products.width,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        altText: products.altText,
        createdAt: products.createdAt
      }).from(products).orderBy(desc(products.createdAt));
      console.log(`Successfully retrieved ${result.length} products`);
      return result;
    } catch (error) {
      console.error("Error in getAllProducts:", error);
      throw error;
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      type: products.type,
      subtype: products.subtype,
      available: products.available,
      stock: products.stock,
      artworkId: products.artworkId,
      printfulProductId: products.printfulProductId,
      isLimitedEdition: products.isLimitedEdition,
      editionSize: products.editionSize,
      editionNumber: products.editionNumber,
      category: products.category,
      featured: products.featured,
      displayOrder: products.displayOrder,
      height: products.height,
      width: products.width,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      altText: products.altText,
      createdAt: products.createdAt
    }).from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByType(type: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.type, type))
      .orderBy(desc(products.createdAt));
  }
  
  async getProductsByArtworkId(artworkId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.artworkId, artworkId))
      .orderBy(desc(products.createdAt));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    console.log("Fetching featured products from database...");
    const featuredProducts = await db.select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      type: products.type,
      subtype: products.subtype,
      available: products.available,
      stock: products.stock,
      artworkId: products.artworkId,
      printfulProductId: products.printfulProductId,
      isLimitedEdition: products.isLimitedEdition,
      editionSize: products.editionSize,
      editionNumber: products.editionNumber,
      category: products.category,
      featured: products.featured,
      displayOrder: products.displayOrder,
      height: products.height,
      width: products.width,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      altText: products.altText,
      createdAt: products.createdAt
    }).from(products).where(eq(products.featured, true)).orderBy(desc(products.id));
    console.log(`Retrieved ${featuredProducts.length} featured products from database`);
    return featuredProducts;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }
  
  async updateProductAvailability(id: number, available: boolean): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ available })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }
  
  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ stock: quantity })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  // Add missing methods needed by the application
  async getArtwork(id: number): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
    return artwork;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }


  
  async updateProductOrder(id: number, displayOrder: number): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ displayOrder })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  // Product variants methods (temporary implementation for Printful integration)
  async getProductVariants(productId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM product_variants 
        WHERE product_id = ${productId}
        ORDER BY is_default DESC, id ASC
      `);
      
      console.log(`Fetching variants for product ${productId}:`, result.rows);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching product variants:", error);
      return [];
    }
  }

  // Contact methods
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(insertMessage).returning();
    return message;
  }

  // Newsletter methods
  async addSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    // Check if subscriber exists
    const existingSubscriber = await this.getSubscriberByEmail(insertSubscriber.email);
    if (existingSubscriber) {
      return existingSubscriber;
    }
    
    const [subscriber] = await db.insert(subscribers).values(insertSubscriber).returning();
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber;
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }
  
  async getAllSettings(): Promise<Settings[]> {
    return await db.select().from(settings);
  }
  
  async upsertSetting(settingData: InsertSettings): Promise<Settings> {
    console.log('[upsertSetting] Entry:', JSON.stringify(settingData));
    
    // Defensive deep validation as recommended by AI consultants
    if (!settingData || typeof settingData !== 'object' || Array.isArray(settingData)) {
      console.error('❌ Invalid settingData: not an object');
      throw new Error('settingData is not an object: ' + JSON.stringify(settingData));
    }
    
    if (typeof settingData.key !== 'string' || settingData.key.trim() === '') {
      console.error('❌ Missing or empty setting key:', settingData);
      throw new Error('Invalid or missing key: ' + JSON.stringify(settingData));
    }
    
    if (typeof settingData.value !== 'string' || settingData.value.trim() === '') {
      console.error('❌ Missing or empty setting value:', settingData);
      throw new Error('Invalid or missing value for key=' + settingData.key + ': ' + JSON.stringify(settingData));
    }

    // Try to find the setting first
    const existingSetting = await this.getSetting(settingData.key);
    
    if (existingSetting) {
      // Update existing setting
      const updatePayload = {
        value: settingData.value,
        description: settingData.description || existingSetting.description,
        updatedAt: new Date()
      };
      console.log('[upsertSetting] About to UPDATE with payload:', JSON.stringify(updatePayload));
      
      const [updatedSetting] = await db
        .update(settings)
        .set(updatePayload)
        .where(eq(settings.key, settingData.key))
        .returning();
      
      return updatedSetting;
    } else {
      // Create new setting with all required fields
      const insertPayload = {
        key: settingData.key,
        value: settingData.value,
        description: settingData.description || '',
        updatedAt: new Date()
      };
      console.log('[upsertSetting] About to INSERT with payload:', JSON.stringify(insertPayload));
      
      // Final validation right before database insert as recommended by AI consultants
      if (!insertPayload.key || !insertPayload.value) {
        console.error('❌ Null insert attempted in insert path:', insertPayload);
        throw new Error('Attempted to insert null setting');
      }
      
      const [newSetting] = await db
        .insert(settings)
        .values(insertPayload)
        .returning();
      
      return newSetting;
    }
  }

  // Additional settings methods needed by the application
  async setSetting(key: string, value: string): Promise<Settings> {
    return this.upsertSetting({ key, value });
  }

  async updateSetting(key: string, value: string): Promise<Settings> {
    return this.upsertSetting({ key, value });
  }

  async createSetting(key: string, value: string, description?: string): Promise<Settings> {
    return this.upsertSetting({ key, value, description });
  }
  
  // Shipping methods
  async createShippingZone(zone: InsertShippingZone): Promise<ShippingZone> {
    const [shippingZone] = await db.insert(shippingZones).values(zone).returning();
    return shippingZone;
  }
  
  async getShippingZoneById(id: number): Promise<ShippingZone | undefined> {
    const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, id));
    return zone;
  }
  
  async getAllShippingZones(): Promise<ShippingZone[]> {
    return await db.select().from(shippingZones);
  }
  
  async getActiveShippingZones(): Promise<ShippingZone[]> {
    return await db.select().from(shippingZones).where(eq(shippingZones.active, true));
  }
  
  async updateShippingZone(id: number, data: Partial<InsertShippingZone>): Promise<ShippingZone | undefined> {
    const [updatedZone] = await db
      .update(shippingZones)
      .set(data)
      .where(eq(shippingZones.id, id))
      .returning();
    
    return updatedZone;
  }
  
  async deleteShippingZone(id: number): Promise<boolean> {
    try {
      await db.delete(shippingZones).where(eq(shippingZones.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting shipping zone:", error);
      return false;
    }
  }

  // Merchandise types operations
  async getAllMerchandiseTypes(): Promise<MerchandiseType[]> {
    return await db.select().from(merchandiseTypes).orderBy(merchandiseTypes.displayOrder);
  }

  async getMerchandiseType(id: number): Promise<MerchandiseType | undefined> {
    const [type] = await db
      .select()
      .from(merchandiseTypes)
      .where(eq(merchandiseTypes.id, id));
    return type;
  }

  async createMerchandiseType(typeData: InsertMerchandiseType): Promise<MerchandiseType> {
    const [newType] = await db
      .insert(merchandiseTypes)
      .values(typeData)
      .returning();
    return newType;
  }

  async updateMerchandiseType(id: number, typeData: Partial<MerchandiseType>): Promise<MerchandiseType> {
    const [updatedType] = await db
      .update(merchandiseTypes)
      .set({ ...typeData, id: undefined })
      .where(eq(merchandiseTypes.id, id))
      .returning();
    return updatedType;
  }

  async deleteMerchandiseType(id: number): Promise<void> {
    await db.delete(merchandiseTypes).where(eq(merchandiseTypes.id, id));
  }

  // Original types operations
  async getAllOriginalTypes(): Promise<OriginalType[]> {
    return await db.select().from(originalTypes).orderBy(originalTypes.displayOrder);
  }

  async getOriginalType(id: number): Promise<OriginalType | undefined> {
    const [type] = await db
      .select()
      .from(originalTypes)
      .where(eq(originalTypes.id, id));
    return type;
  }

  async createOriginalType(typeData: InsertOriginalType): Promise<OriginalType> {
    const [newType] = await db
      .insert(originalTypes)
      .values(typeData)
      .returning();
    return newType;
  }

  async updateOriginalType(id: number, typeData: Partial<OriginalType>): Promise<OriginalType> {
    const [updatedType] = await db
      .update(originalTypes)
      .set({ ...typeData, id: undefined })
      .where(eq(originalTypes.id, id))
      .returning();
    return updatedType;
  }

  async deleteOriginalType(id: number): Promise<void> {
    await db.delete(originalTypes).where(eq(originalTypes.id, id));
  }
  
  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async updateOrderPaymentIntent(id: number, paymentIntentId: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        paymentIntentId,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async updateOrderNotes(id: number, notes: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        notes,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  
  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));
  }
  
  // Order items methods
  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(item).returning();
    return orderItem;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
  
  async getOrderItemsWithProductDetails(orderId: number): Promise<Array<OrderItem & { productDetails: Product }>> {
    const items = await this.getOrderItems(orderId);
    const productIds = items
      .filter(item => item.productId !== null && item.productId !== undefined)
      .map(item => item.productId!);
    
    if (productIds.length === 0) {
      return [];
    }
    
    // Get all products in one query
    const allProducts = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        type: products.type,
        subtype: products.subtype,
        available: products.available,
        stock: products.stock,
        artworkId: products.artworkId,
        printfulProductId: products.printfulProductId,
        isLimitedEdition: products.isLimitedEdition,
        editionSize: products.editionSize,
        editionNumber: products.editionNumber,
        category: products.category,
        featured: products.featured,
        displayOrder: products.displayOrder,
        height: products.height,
        width: products.width,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        altText: products.altText,
        createdAt: products.createdAt
      })
      .from(products)
      .where(inArray(products.id, productIds));
    
    // Create a map for faster lookup
    const productMap = new Map<number, Product>();
    allProducts.forEach(product => productMap.set(product.id, product));
    
    // Join the data manually
    return items
      .filter(item => item.productId !== null && item.productId !== undefined && productMap.has(item.productId))
      .map(item => ({
        ...item,
        productDetails: productMap.get(item.productId!)!
      }));
  }
  
  async getOrderItemsWithDetails(orderId: number): Promise<any[]> {
    const items = await this.getOrderItems(orderId);
    const result = [];
    
    // Get all product IDs and artwork IDs
    const productIds = items
      .filter(item => item.productId !== null && item.productId !== undefined)
      .map(item => item.productId!);
    
    const artworkIds = items
      .filter(item => item.artworkId !== null && item.artworkId !== undefined)
      .map(item => item.artworkId!);
    
    // Fetch all products and artworks in bulk
    const allProducts = productIds.length > 0 
      ? await db.select({
          id: products.id,
          title: products.title,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          type: products.type,
          subtype: products.subtype,
          available: products.available,
          stock: products.stock,
          artworkId: products.artworkId,
          printfulProductId: products.printfulProductId,
          isLimitedEdition: products.isLimitedEdition,
          editionSize: products.editionSize,
          editionNumber: products.editionNumber,
          category: products.category,
          featured: products.featured,
          displayOrder: products.displayOrder,
          height: products.height,
          width: products.width,
          seoTitle: products.seoTitle,
          seoDescription: products.seoDescription,
          altText: products.altText,
          createdAt: products.createdAt
        }).from(products).where(inArray(products.id, productIds))
      : [];
      
    const allArtworks = artworkIds.length > 0
      ? await db.select({
          id: artworks.id,
          title: artworks.title,
          description: artworks.description,
          imageUrl: artworks.imageUrl,
          category: artworks.category,
          medium: artworks.medium,
          year: artworks.year,
          price: artworks.price,
          available: artworks.available,
          featured: artworks.featured,
          displayOrder: artworks.displayOrder,
          height: artworks.height,
          width: artworks.width,
          depth: artworks.depth,
          weight: artworks.weight,
          isLimitedEdition: artworks.isLimitedEdition,
          editionSize: artworks.editionSize,
          editionsSold: artworks.editionsSold,
          seoTitle: artworks.seoTitle,
          seoDescription: artworks.seoDescription,
          altText: artworks.altText,
          status: artworks.status,
          location: artworks.location,
          createdAt: artworks.createdAt,
          updatedAt: artworks.updatedAt
        }).from(artworks).where(inArray(artworks.id, artworkIds))
      : [];
    
    // Create maps for faster lookup
    const productMap = new Map<number, Product>();
    allProducts.forEach(product => productMap.set(product.id, product));
    
    const artworkMap = new Map<number, Artwork>();
    allArtworks.forEach(artwork => artworkMap.set(artwork.id, artwork));
    
    // Process each item
    for (const item of items) {
      if (item.itemType === 'product' && item.productId && productMap.has(item.productId)) {
        const product = productMap.get(item.productId)!;
        result.push({
          ...item,
          productDetails: product,
          itemTypeLabel: 'Product',
          itemImage: product.imageUrl,
          itemName: product.name
        });
      } else if (item.artworkId && artworkMap.has(item.artworkId)) {
        const artwork = artworkMap.get(item.artworkId)!;
        let itemTypeLabel = 'Original Artwork';
        
        if (item.itemType === 'limited_edition') {
          itemTypeLabel = `Limited Edition Print (${item.editionNumber}/${artwork.editionSize})`;
        } else if (item.itemType === 'digital') {
          const licenseLabel = item.licenseType === 'personal' ? 'Personal' : 'Commercial';
          itemTypeLabel = `Digital Download (${licenseLabel} License)`;
        }
        
        result.push({
          ...item,
          artworkDetails: artwork,
          itemTypeLabel,
          itemImage: artwork.imageUrl,
          itemName: artwork.title
        });
      }
    }
    
    return result;
  }
  
  // Digital download methods
  async getDigitalDownload(downloadCode: string): Promise<{order: Order, items: any[]} | null> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.downloadCode, downloadCode));
      
      if (!order) return null;
      
      // Check if the download has expired
      if (order.downloadExpiresAt && new Date(order.downloadExpiresAt) < new Date()) {
        return null;
      }
      
      const items = await this.getOrderItemsWithDetails(order.id);
      
      return { order, items };
    } catch (error) {
      console.error("Error fetching digital download:", error);
      return null;
    }
  }
  
  async incrementDownloadCount(orderId: number): Promise<boolean> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      
      if (!order) return false;
      
      await db
        .update(orders)
        .set({ 
          downloadCount: (order.downloadCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
      
      return true;
    } catch (error) {
      console.error("Error incrementing download count:", error);
      return false;
    }
  }
  
  // Limited edition methods
  async updateEditionsSold(artworkId: number, count: number): Promise<boolean> {
    try {
      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId));
      
      if (!artwork) return false;
      
      // Calculate the new total of editions sold
      const currentSold = artwork.editionsSold || 0;
      const newSold = currentSold + count;
      
      // Check if we've reached or exceeded the edition limit
      const editionSize = artwork.editionSize || null;
      const limitReached = editionSize !== null && newSold >= editionSize;
      
      // If limit reached, set editions sold to the maximum and mark as unavailable
      if (limitReached) {
        console.log(`Limited edition for artwork #${artworkId} is now sold out (${editionSize}/${editionSize})`);
        
        await db
          .update(artworks)
          .set({ 
            editionsSold: editionSize,
            limitedEditionAvailable: false
          })
          .where(eq(artworks.id, artworkId));
      } else {
        // Otherwise just update the count and ensure availability is correctly set
        await db
          .update(artworks)
          .set({ 
            editionsSold: newSold,
            limitedEditionAvailable: true
          })
          .where(eq(artworks.id, artworkId));
      }
      
      return true;
    } catch (error) {
      console.error("Error updating editions sold:", error);
      return false;
    }
  }
  
  // Check and update limited edition availability
  async checkLimitedEditionAvailability(artworkId: number): Promise<boolean> {
    try {
      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId));
      
      if (!artwork || !artwork.isLimitedEdition) return false;
      
      // If edition size is null, it means unlimited editions
      if (artwork.editionSize === null) {
        await db
          .update(artworks)
          .set({ limitedEditionAvailable: true })
          .where(eq(artworks.id, artworkId));
        return true;
      }
      
      // Check if we've sold all available editions
      const isAvailable = (artwork.editionsSold || 0) < artwork.editionSize;
      
      // Update availability status if it's different from current
      if (isAvailable !== artwork.limitedEditionAvailable) {
        await db
          .update(artworks)
          .set({ limitedEditionAvailable: isAvailable })
          .where(eq(artworks.id, artworkId));
      }
      
      return isAvailable;
    } catch (error) {
      console.error("Error checking limited edition availability:", error);
      return false;
    }
  }

  // Update product dimensions - sync from artwork to product
  async updateProductDimensions(productId: number, height: number, width: number): Promise<Product | undefined> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          height: height,
          width: width
        })
        .where(eq(products.id, productId))
        .returning();
      
      console.log(`✅ Updated product #${productId} dimensions to ${height}" × ${width}"`);
      return updatedProduct;
    } catch (error) {
      console.error("Error updating product dimensions:", error);
      throw error;
    }
  }

  // Print-on-demand order management methods
  async getPendingPrintfulOrders(): Promise<Order[]> {
    try {
      return await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.status, 'processing'),
          sql`${orders.printfulOrderId} IS NULL`
        ))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting pending Printful orders:", error);
      throw error;
    }
  }

  async getPendingGootenOrders(): Promise<Order[]> {
    try {
      return await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.status, 'processing'),
          sql`${orders.gootenOrderId} IS NULL`
        ))
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting pending Gooten orders:", error);
      throw error;
    }
  }

  async getAllPendingPrintOrders(): Promise<{ printful: Order[], gooten: Order[] }> {
    try {
      const [printfulOrders, gootenOrders] = await Promise.all([
        this.getPendingPrintfulOrders(),
        this.getPendingGootenOrders()
      ]);
      
      return {
        printful: printfulOrders,
        gooten: gootenOrders
      };
    } catch (error) {
      console.error("Error getting all pending print orders:", error);
      throw error;
    }
  }

  async updateOrder(orderId: number, updates: Partial<Order>): Promise<Order> {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();
      
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<Order | undefined> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      
      return order;
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  }

  // API Configuration methods for centralized key management with encryption
  async getAllApiConfigs(): Promise<ApiConfiguration[]> {
    try {
      const configs = await db
        .select()
        .from(apiConfigurations)
        .where(eq(apiConfigurations.isActive, true))
        .orderBy(asc(apiConfigurations.service), asc(apiConfigurations.key));
      
      // Decrypt values for use (but keep originals for masking in API responses)
      return configs.map(config => ({
        ...config,
        value: config.value ? this.decryptApiValue(config.value) : ''
      }));
    } catch (error) {
      console.error("Error getting API configurations:", error);
      return [];
    }
  }

  async getApiConfig(key: string): Promise<ApiConfiguration | undefined> {
    try {
      const [config] = await db
        .select()
        .from(apiConfigurations)
        .where(and(eq(apiConfigurations.key, key), eq(apiConfigurations.isActive, true)));
      
      if (!config) return undefined;
      
      // Decrypt the value for use
      return {
        ...config,
        value: config.value ? this.decryptApiValue(config.value) : ''
      };
    } catch (error) {
      console.error("Error getting API configuration:", error);
      return undefined;
    }
  }

  async setApiConfig(key: string, value: string, service?: string, description?: string): Promise<ApiConfiguration> {
    try {
      // Encrypt the value before storing
      const encryptedValue = this.encryptApiValue(value);
      
      // Check if configuration already exists
      const existing = await db
        .select()
        .from(apiConfigurations)
        .where(eq(apiConfigurations.key, key))
        .limit(1);

      if (existing.length > 0) {
        // Update existing configuration
        const [updated] = await db
          .update(apiConfigurations)
          .set({
            value: encryptedValue,
            service: service || existing[0].service,
            description: description || existing[0].description,
            updatedAt: new Date()
          })
          .where(eq(apiConfigurations.key, key))
          .returning();

        return {
          ...updated,
          value: value // Return decrypted value for immediate use
        };
      } else {
        // Create new configuration
        const [created] = await db
          .insert(apiConfigurations)
          .values({
            key,
            value: encryptedValue,
            service: service || 'unknown',
            description: description || '',
            isActive: true
          })
          .returning();

        return {
          ...created,
          value: value // Return decrypted value for immediate use
        };
      }
    } catch (error) {
      console.error("Error setting API configuration:", error);
      throw error;
    }
  }

  async updateApiConfig(key: string, value: string): Promise<ApiConfiguration | undefined> {
    try {
      const encryptedValue = this.encryptApiValue(value);
      
      const [updated] = await db
        .update(apiConfigurations)
        .set({
          value: encryptedValue,
          updatedAt: new Date()
        })
        .where(eq(apiConfigurations.key, key))
        .returning();

      if (!updated) return undefined;

      return {
        ...updated,
        value: value // Return decrypted value for immediate use
      };
    } catch (error) {
      console.error("Error updating API configuration:", error);
      return undefined;
    }
  }

  async deleteApiConfig(key: string): Promise<boolean> {
    try {
      const result = await db
        .update(apiConfigurations)
        .set({ isActive: false })
        .where(eq(apiConfigurations.key, key));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting API configuration:", error);
      return false;
    }
  }

  // Migration method to encrypt existing plain text API keys
  async migrateApiKeysToEncrypted(): Promise<{ migrated: number; errors: string[] }> {
    try {
      const allConfigs = await db.select().from(apiConfigurations);
      let migrated = 0;
      const errors: string[] = [];

      for (const config of allConfigs) {
        try {
          if (!isEncrypted(config.value)) {
            const encryptedValue = this.encryptApiValue(config.value);
            await db
              .update(apiConfigurations)
              .set({ 
                value: encryptedValue,
                updatedAt: new Date()
              })
              .where(eq(apiConfigurations.id, config.id));
            migrated++;
            console.log(`✅ Migrated API key: ${config.key}`);
          }
        } catch (error) {
          const errorMsg = `Failed to migrate ${config.key}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error("Error during API key migration:", error);
      return { migrated: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  // Get admin dashboard data (legacy method - keeping for compatibility)
  async getAdminData(): Promise<any> {
    try {
      // Use the correct key names that match updateAdminMfa method
      const mfaEnabledSetting = await this.getSetting('admin_mfa_enabled');
      const mfaSecretSetting = await this.getSetting('admin_mfa_secret');
      
      console.log('🔍 getAdminData - Raw settings:', {
        enabledSetting: mfaEnabledSetting,
        secretSetting: mfaSecretSetting
      });
      
      return {
        mfaEnabled: mfaEnabledSetting?.value === 'true',
        mfaSecret: mfaSecretSetting?.value || null
      };
    } catch (error) {
      console.error('❌ getAdminData error:', error);
      return {
        mfaEnabled: false,
        mfaSecret: null
      };
    }
  }

  async deleteApiConfig(key: string): Promise<boolean> {
    try {
      const result = await db
        .update(apiConfigurations)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(apiConfigurations.key, key));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting API configuration:", error);
      return false;
    }
  }

  // Email template management
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(template).returning();
    return result[0];
  }

  async createTrustedDevice(device: InsertTrustedDevice): Promise<TrustedDevice> {
    const result = await db.insert(trustedDevices).values(device).returning();
    return result[0];
  }
  }

  // Email Template methods
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.templateKey);
  }

  async getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.templateKey, templateKey));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(templateKey: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.templateKey, templateKey))
      .returning();
    return updatedTemplate;
  }

  // Trusted Device Management for Enhanced MFA Security
  async createTrustedDevice(device: InsertTrustedDevice): Promise<TrustedDevice> {
    const [newDevice] = await db.insert(trustedDevices).values(device).returning();
    return newDevice;
  }

  async getTrustedDevice(deviceId: string): Promise<TrustedDevice | undefined> {
    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.deviceId, deviceId));
    return device;
  }

  async getTrustedDeviceByFingerprint(userId: number, fingerprint: string): Promise<TrustedDevice | undefined> {
    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.fingerprint, fingerprint)
      ));
    return device;
  }

  async updateTrustedDeviceLastUsed(deviceId: string): Promise<void> {
    await db
      .update(trustedDevices)
      .set({ lastUsed: new Date() })
      .where(eq(trustedDevices.deviceId, deviceId));
  }

  async cleanupExpiredTrustedDevices(): Promise<number> {
    const result = await db
      .delete(trustedDevices)
      .where(sql`${trustedDevices.expiresAt} < NOW()`);
    return result.rowCount || 0;
  }

  async getUserTrustedDevices(userId: number): Promise<TrustedDevice[]> {
    return await db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .orderBy(desc(trustedDevices.lastUsed));
  }

  async revokeTrustedDevice(deviceId: string): Promise<boolean> {
    const result = await db
      .delete(trustedDevices)
      .where(eq(trustedDevices.deviceId, deviceId));
    return (result.rowCount || 0) > 0;
  }
}