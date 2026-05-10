import { db } from "./db";
import { 
  users, 
  artworks, 
  products, 
  contactMessages, 
  subscribers, 
  settings, 
  shippingZones,
  merchandiseTypes,
  originalTypes,
  orders,
  orderItems,
  apiConfigurations,
  emailTemplates,
  trustedDevices
} from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import { 
  User, 
  InsertUser, 
  Artwork, 
  InsertArtwork, 
  Product, 
  InsertProduct,
  ContactMessage,
  InsertContactMessage,
  Subscriber,
  InsertSubscriber,
  Settings,
  InsertSettings,
  ShippingZone,
  InsertShippingZone,
  MerchandiseType,
  InsertMerchandiseType,
  OriginalType,
  InsertOriginalType,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  ApiConfiguration,
  EmailTemplate,
  InsertEmailTemplate,
  TrustedDevice,
  InsertTrustedDevice
} from "@shared/schema";
import { encryptApiKey, decryptApiKey } from "./utils/simple-encryption";

export class DatabaseStorage implements IStorage {
  constructor() {
    console.log('🔧 DatabaseStorage initialized with encryption support');
  }

  private encryptApiValue(value: string): string {
    try {
      return encryptApiKey(value);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt API value');
    }
  }

  private decryptApiValue(encryptedValue: string): string {
    try {
      return decryptApiKey(encryptedValue);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt API value');
    }
  }

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
    const [user] = await db
      .update(users)
      .set({ mfaEnabled: enabled, mfaSecret: secret })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCredentials(id: number, username: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ username, password })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllArtworks(): Promise<Artwork[]> {
    return await db.select().from(artworks).orderBy(artworks.displayOrder);
  }

  async getArtworkById(id: number): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
    return artwork;
  }

  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    return await db.select().from(artworks).where(eq(artworks.category, category)).orderBy(artworks.displayOrder);
  }

  async getFeaturedArtworks(): Promise<Artwork[]> {
    return await db.select().from(artworks).where(eq(artworks.featured, true)).orderBy(artworks.displayOrder);
  }

  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const [artwork] = await db.insert(artworks).values(insertArtwork).returning();
    return artwork;
  }

  async updateArtwork(id: number, artworkData: Partial<InsertArtwork>): Promise<Artwork | undefined> {
    const [artwork] = await db
      .update(artworks)
      .set(artworkData)
      .where(eq(artworks.id, id))
      .returning();
    return artwork;
  }

  async deleteArtwork(id: number): Promise<boolean> {
    const result = await db.delete(artworks).where(eq(artworks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateArtworkOrder(id: number, displayOrder: number): Promise<Artwork | undefined> {
    const [artwork] = await db
      .update(artworks)
      .set({ displayOrder })
      .where(eq(artworks.id, id))
      .returning();
    return artwork;
  }

  async updateArtworkCategories(oldCategory: string, newCategory: string): Promise<number> {
    const result = await db
      .update(artworks)
      .set({ category: newCategory })
      .where(eq(artworks.category, oldCategory));
    return result.rowCount || 0;
  }

  async updateArtworkAvailability(id: number, available: boolean): Promise<Artwork | undefined> {
    const [artwork] = await db
      .update(artworks)
      .set({ available })
      .where(eq(artworks.id, id))
      .returning();
    return artwork;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.displayOrder);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByType(type: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.type, type));
  }

  async getProductsByArtworkId(artworkId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.artworkId, artworkId));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateProductAvailability(id: number, available: boolean): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ available })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ stockQuantity: quantity })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getArtwork(id: number): Promise<Artwork | undefined> {
    return this.getArtworkById(id);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.getProductById(id);
  }

  async updateProductOrder(id: number, displayOrder: number): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ displayOrder })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getProductVariants(productId: number): Promise<any[]> {
    // Placeholder for product variants functionality
    return [];
  }

  // Contact and subscriber methods
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(insertMessage).returning();
    return message;
  }

  async addSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
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
    const existing = await this.getSetting(settingData.key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: settingData.value, description: settingData.description })
        .where(eq(settings.key, settingData.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(settingData).returning();
      return created;
    }
  }

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
    const [zone] = await db
      .update(shippingZones)
      .set(data)
      .where(eq(shippingZones.id, id))
      .returning();
    return zone;
  }

  async deleteShippingZone(id: number): Promise<boolean> {
    const result = await db.delete(shippingZones).where(eq(shippingZones.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Merchandise and original type methods
  async getAllMerchandiseTypes(): Promise<MerchandiseType[]> {
    return await db.select().from(merchandiseTypes).orderBy(merchandiseTypes.displayOrder);
  }

  async getMerchandiseType(id: number): Promise<MerchandiseType | undefined> {
    const [type] = await db.select().from(merchandiseTypes).where(eq(merchandiseTypes.id, id));
    return type;
  }

  async createMerchandiseType(typeData: InsertMerchandiseType): Promise<MerchandiseType> {
    const [type] = await db.insert(merchandiseTypes).values(typeData).returning();
    return type;
  }

  async updateMerchandiseType(id: number, typeData: Partial<MerchandiseType>): Promise<MerchandiseType> {
    const [type] = await db
      .update(merchandiseTypes)
      .set(typeData)
      .where(eq(merchandiseTypes.id, id))
      .returning();
    return type;
  }

  async deleteMerchandiseType(id: number): Promise<void> {
    await db.delete(merchandiseTypes).where(eq(merchandiseTypes.id, id));
  }

  async getAllOriginalTypes(): Promise<OriginalType[]> {
    return await db.select().from(originalTypes).orderBy(originalTypes.displayOrder);
  }

  async getOriginalType(id: number): Promise<OriginalType | undefined> {
    const [type] = await db.select().from(originalTypes).where(eq(originalTypes.id, id));
    return type;
  }

  async createOriginalType(typeData: InsertOriginalType): Promise<OriginalType> {
    const [type] = await db.insert(originalTypes).values(typeData).returning();
    return type;
  }

  async updateOriginalType(id: number, typeData: Partial<OriginalType>): Promise<OriginalType> {
    const [type] = await db
      .update(originalTypes)
      .set(typeData)
      .where(eq(originalTypes.id, id))
      .returning();
    return type;
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
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderPaymentIntent(id: number, paymentIntentId: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ paymentIntentId })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderNotes(id: number, notes: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ notes })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerEmail, email));
  }

  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(item).returning();
    return orderItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItemsWithProductDetails(orderId: number): Promise<Array<OrderItem & { productDetails: Product }>> {
    const items = await db
      .select({
        orderItem: orderItems,
        product: products
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map(item => ({
      ...item.orderItem,
      productDetails: item.product!
    }));
  }

  async getOrderItemsWithDetails(orderId: number): Promise<any[]> {
    return this.getOrderItemsWithProductDetails(orderId);
  }

  async getDigitalDownload(downloadCode: string): Promise<{order: Order, items: any[]} | null> {
    const [order] = await db.select().from(orders).where(eq(orders.downloadCode, downloadCode));
    if (!order) return null;

    const items = await this.getOrderItemsWithDetails(order.id);
    return { order, items };
  }

  async incrementDownloadCount(orderId: number): Promise<boolean> {
    const result = await db
      .update(orders)
      .set({ downloadCount: sql`${orders.downloadCount} + 1` })
      .where(eq(orders.id, orderId));
    return (result.rowCount || 0) > 0;
  }

  async updateEditionsSold(artworkId: number, count: number): Promise<boolean> {
    const result = await db
      .update(artworks)
      .set({ editionsSold: sql`${artworks.editionsSold} + ${count}` })
      .where(eq(artworks.id, artworkId));
    return (result.rowCount || 0) > 0;
  }

  async checkLimitedEditionAvailability(artworkId: number): Promise<boolean> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, artworkId));
    if (!artwork) return false;
    
    if (artwork.limitedEdition && artwork.editionLimit) {
      return (artwork.editionsSold || 0) < artwork.editionLimit;
    }
    return true;
  }

  async updateProductDimensions(productId: number, height: number, width: number): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ height, width })
      .where(eq(products.id, productId))
      .returning();
    return product;
  }

  async getPendingPrintfulOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.status, 'pending'),
        eq(orders.fulfillmentProvider, 'printful')
      ));
  }

  async getPendingGootenOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.status, 'pending'),
        eq(orders.fulfillmentProvider, 'gooten')
      ));
  }

  async getAllPendingPrintOrders(): Promise<{ printful: Order[], gooten: Order[] }> {
    const printful = await this.getPendingPrintfulOrders();
    const gooten = await this.getPendingGootenOrders();
    return { printful, gooten };
  }

  async updateOrder(orderId: number, updates: Partial<Order>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async getOrder(orderId: number): Promise<Order | undefined> {
    return this.getOrderById(orderId);
  }

  // API Configuration methods with encryption
  async getAllApiConfigs(): Promise<ApiConfiguration[]> {
    const configs = await db.select().from(apiConfigurations);
    return configs.map(config => ({
      ...config,
      value: this.decryptApiValue(config.value)
    }));
  }

  async getApiConfig(key: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.key, key));
    if (!config) return undefined;
    
    return {
      ...config,
      value: this.decryptApiValue(config.value)
    };
  }

  async setApiConfig(key: string, value: string, service?: string, description?: string): Promise<ApiConfiguration> {
    const encryptedValue = this.encryptApiValue(value);
    const existing = await db.select().from(apiConfigurations).where(eq(apiConfigurations.key, key));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(apiConfigurations)
        .set({ 
          value: encryptedValue, 
          service, 
          description,
          updatedAt: new Date()
        })
        .where(eq(apiConfigurations.key, key))
        .returning();
      return { ...updated, value };
    } else {
      const [created] = await db
        .insert(apiConfigurations)
        .values({ key, value: encryptedValue, service, description, isActive: true })
        .returning();
      return { ...created, value };
    }
  }

  async updateApiConfig(key: string, value: string): Promise<ApiConfiguration | undefined> {
    const encryptedValue = this.encryptApiValue(value);
    const [updated] = await db
      .update(apiConfigurations)
      .set({ value: encryptedValue, updatedAt: new Date() })
      .where(eq(apiConfigurations.key, key))
      .returning();
    
    if (!updated) return undefined;
    return { ...updated, value };
  }

  async deleteApiConfig(key: string): Promise<boolean> {
    const result = await db.delete(apiConfigurations).where(eq(apiConfigurations.key, key));
    return (result.rowCount || 0) > 0;
  }

  async migrateApiKeysToEncrypted(): Promise<{ migrated: number; errors: string[] }> {
    const configs = await db.select().from(apiConfigurations);
    let migrated = 0;
    const errors: string[] = [];

    for (const config of configs) {
      try {
        // Test if already encrypted by trying to decrypt
        this.decryptApiValue(config.value);
      } catch {
        // Not encrypted, so encrypt it
        try {
          const encryptedValue = this.encryptApiValue(config.value);
          await db
            .update(apiConfigurations)
            .set({ value: encryptedValue })
            .where(eq(apiConfigurations.key, config.key));
          migrated++;
        } catch (error) {
          errors.push(`Failed to encrypt ${config.key}: ${error}`);
        }
      }
    }

    return { migrated, errors };
  }

  async getAdminData(): Promise<any> {
    const artworks = await this.getAllArtworks();
    const products = await this.getAllProducts();
    const orders = await this.getAllOrders();
    const settings = await this.getAllSettings();
    
    return {
      artworks,
      products,
      orders,
      settings,
      stats: {
        totalArtworks: artworks.length,
        totalProducts: products.length,
        totalOrders: orders.length
      }
    };
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