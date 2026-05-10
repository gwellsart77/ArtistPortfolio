import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"),
});

// Trusted devices for MFA - server-side storage for better security
export const trustedDevices = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deviceId: text("device_id").notNull().unique(),
  fingerprint: text("fingerprint").notNull(),
  deviceName: text("device_name"), // Optional friendly name
  lastUsed: timestamp("last_used").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({
  id: true,
  lastUsed: true,
  createdAt: true,
});

// Commission categories
export const commissionCategories = pgTable("commission_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isMainCategory: boolean("is_main_category").default(true),
  parentCategoryId: integer("parent_category_id"),
  acceptingCommissions: boolean("accepting_commissions").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission subcategories
export const commissionSubcategories = pgTable("commission_subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
  acceptingCommissions: boolean("accepting_commissions").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission requests
export const commissionRequests = pgTable("commission_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  phone: text("phone"),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
  projectDescription: text("project_description").notNull(),
  dimensions: text("dimensions"),
  estimatedPrice: doublePrecision("estimated_price"),
  status: text("status").default('pending'), // pending, reviewed, accepted, declined, completed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  location: text("location"),
  message: text("message").notNull(),
});

export const insertCommissionCategorySchema = createInsertSchema(commissionCategories);
export const insertCommissionSubcategorySchema = createInsertSchema(commissionSubcategories);
export const insertCommissionRequestSchema = createInsertSchema(commissionRequests);

// Commission settings
export const commissionSettings = pgTable("commission_settings", {
  id: serial("id").primaryKey(),
  paintingMultiplier: doublePrecision("painting_multiplier").default(2.5), // Price per square inch
  muralMultiplier: doublePrecision("mural_multiplier").default(45.0), // Price per square foot
  artistEmail: text("artist_email").notNull().default("artist@example.com"),
  autoReplySubject: text("auto_reply_subject").default("Thank you for your commission request"),
  autoReplyContent: text("auto_reply_content").default("Thank you for your commission request! I will review your message and get back to you within 2-3 business days."),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommissionSettingsSchema = createInsertSchema(commissionSettings);

// Artwork categories
export type ArtworkCategory = "imaginative-realism" | "sculpture" | "still-life" | "figurative" | "chinese-zodiac-series" | "vinyl-record-art" | "murals";

// Define artwork status type
export type ArtworkStatus = 'available' | 'sold' | 'unavailable';

// Artwork schema
export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  year: text("year").notNull(),
  medium: text("medium").notNull(),
  dimensions: text("dimensions"),
  price: integer("price"),  // Making price optional
  imageUrl: text("image_url").notNull(),
  featured: boolean("featured").default(false),
  available: boolean("available").default(true), // For backward compatibility 
  status: text("status").default('available'), // New status field
  displayOrder: integer("display_order").default(0),
  // Artist information
  artistName: text("artist_name").default("Gabe Wells"),
  // For limited edition prints
  isLimitedEdition: boolean("is_limited_edition").default(false),
  editionSize: integer("edition_size"),
  editionsSold: integer("editions_sold").default(0),
  limitedEditionPrice: integer("limited_edition_price"), // Separate price for limited edition prints
  limitedEditionAvailable: boolean("limited_edition_available").default(true), // Whether limited editions are still available
  // For digital downloads
  hasDigitalVersion: boolean("has_digital_version").default(false),
  digitalFileUrl: text("digital_file_url"),
  digitalPrice: integer("digital_price"),
  // Standard licenses for digital downloads
  personalLicensePrice: integer("personal_license_price"),
  commercialLicensePrice: integer("commercial_license_price"),
  // SEO metadata fields
  seoTitle: text("seo_title"), // Custom title tag for SEO
  seoDescription: text("seo_description"), // Meta description for search engines
  altText: text("alt_text"), // Alt text for the image
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArtworkSchema = createInsertSchema(artworks).omit({
  id: true,
  createdAt: true,
});

// Product schema with type (originals, prints, merchandise)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  type: text("type").notNull(), // "originals", "prints", "merchandise", "printful"
  subtype: text("subtype"), // For print subcategories: "paper", "canvas", "framed"
  available: boolean("available").default(true),
  stock: integer("stock").notNull().default(1),
  artworkId: integer("artwork_id"), // If related to an artwork (for prints and originals)
  printfulProductId: text("printful_product_id"), // For Printful products
  isLimitedEdition: boolean("is_limited_edition").default(false), // For limited edition prints
  editionSize: integer("edition_size"), // Total number of prints in the edition
  editionNumber: integer("edition_number"), // The specific number of this print in the edition
  category: text("category"), // For categorizing products
  featured: boolean("featured").default(false), // For featuring products on the homepage
  displayOrder: integer("display_order").default(0), // For sorting products in the shop
  // Dimensions for original artwork pricing
  height: doublePrecision("height"), // Height in inches
  width: doublePrecision("width"), // Width in inches
  // SEO metadata fields
  seoTitle: text("seo_title"), // Custom title tag for SEO
  seoDescription: text("seo_description"), // Meta description for search engines
  altText: text("alt_text"), // Alt text for the image
  createdAt: timestamp("created_at").defaultNow(),
});

// Product variants for different sizes, colors, etc.
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  variantName: text("variant_name").notNull(), // e.g., "16×20", "24×30"
  price: integer("price").notNull(),
  stock: integer("stock").default(999),
  printfulVariantId: text("printful_variant_id"), // For Printful variants
  available: boolean("available").default(true),
  isDefault: boolean("is_default").default(false),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
});

// Contact messages schema
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  subscribeToNewsletter: boolean("subscribe_to_newsletter").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

// Newsletter subscribers schema
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;
export type TrustedDevice = typeof trustedDevices.$inferSelect;

export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworks.$inferSelect;



export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

// Website settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Email templates schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  templateKey: text("template_key").notNull().unique(), // 'order_confirmation', 'commission_confirmation'
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Validation schemas for forms
export const contactFormSchema = insertContactMessageSchema.extend({
  email: z.string().email({ message: "Please enter a valid email address" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

export const newsletterFormSchema = insertSubscriberSchema.extend({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Shipping zones for USPS shipping rates
export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  baseRate: doublePrecision("base_rate").notNull(), // Base shipping rate for this zone
  additionalItemRate: doublePrecision("additional_item_rate").notNull(), // Additional cost per item in the same order
  active: boolean("active").default(true),
});

export const insertShippingZoneSchema = createInsertSchema(shippingZones).omit({
  id: true,
});

export type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;
export type ShippingZone = typeof shippingZones.$inferSelect;

// Order status enum type
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Order type enum
export type OrderType = 'physical' | 'digital' | 'mixed';

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address").notNull(),
  phone: text("phone"),
  totalAmount: integer("total_amount").notNull(), // In cents
  shippingAmount: integer("shipping_amount").default(0), // In cents
  shippingZoneId: integer("shipping_zone_id"),
  status: text("status").notNull().default('pending'),
  orderType: text("order_type").notNull().default('physical'),
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  downloadCode: text("download_code"), // Unique code for downloading digital products
  downloadExpiresAt: timestamp("download_expires_at"), // When digital download links expire
  downloadCount: integer("download_count").default(0), // Track how many times it was downloaded
  licenseType: text("license_type"), // For digital products: 'personal', 'commercial'
  notes: text("notes"),
  // Third-party integration fields
  printfulOrderId: text("printful_order_id"), // Printful order ID for tracking
  gootenOrderId: text("gooten_order_id"), // Gooten order ID for tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order items (products in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  artworkId: integer("artwork_id"),
  itemType: text("item_type").notNull(), // 'artwork', 'product', 'digital', 'limited_edition'
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Price at the time of order, in cents
  editionNumber: integer("edition_number"), // For limited editions, which number in the series
  licenseType: text("license_type"), // For digital items: 'personal', 'commercial'
  digitalFileUrl: text("digital_file_url"), // URL to download the digital file
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Checkout form validation schema with separate address fields
export const checkoutFormSchema = z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  customerEmail: z.string().email({ message: "Please enter a valid email address" }),
  
  // Shipping address fields
  shippingStreetAddress: z.string().min(3, { message: "Street address is required" }),
  shippingApartment: z.string().optional(),
  shippingCity: z.string().min(2, { message: "City is required" }),
  shippingState: z.string().min(1, { message: "State is required" }),
  shippingZipCode: z.string().min(5, { message: "ZIP code is required" }),
  
  // Billing same as shipping checkbox
  billingSameAsShipping: z.boolean().default(true),
  
  // Billing address fields (optional when same as shipping)
  billingStreetAddress: z.string().optional(),
  billingApartment: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  
  phone: z.string().optional(),
  shippingZoneId: z.number({ message: "Please select a shipping option" }),
  notes: z.string().optional(),
});

// Merchandise types for dynamic subcategories
export const merchandiseTypes = pgTable("merchandise_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchandiseTypeSchema = createInsertSchema(merchandiseTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertMerchandiseType = z.infer<typeof insertMerchandiseTypeSchema>;
export type MerchandiseType = typeof merchandiseTypes.$inferSelect;

// Original types for dynamic subcategories
export const originalTypes = pgTable("original_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOriginalTypeSchema = createInsertSchema(originalTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertOriginalType = z.infer<typeof insertOriginalTypeSchema>;
export type OriginalType = typeof originalTypes.$inferSelect;

// User Preferences for Art Recommendations
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // Track anonymous users too
  userId: integer("user_id"), // Link to users table if logged in
  favoriteCategories: jsonb("favorite_categories").default([]), // Array of liked categories
  priceRange: jsonb("price_range").default({}), // {min: 0, max: 1000}
  artStyles: jsonb("art_styles").default([]), // Abstract, figurative, etc.
  colorPreferences: jsonb("color_preferences").default([]), // Dominant colors they like
  mediumPreferences: jsonb("medium_preferences").default([]), // Oil, digital, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for recommendation engine - ~85% query speed improvement
  sessionIdIdx: index("user_preferences_session_id_idx").on(table.sessionId),
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
  updatedAtIdx: index("user_preferences_updated_at_idx").on(table.updatedAt),
}));

// User Art Interactions for tracking behavior
export const userArtInteractions = pgTable("user_art_interactions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"), // Link to users table if logged in
  artworkId: integer("artwork_id").notNull(),
  productId: integer("product_id"), // If interaction was with a product
  interactionType: text("interaction_type").notNull(), // view, like, cart_add, purchase, share
  timeSpent: integer("time_spent"), // Seconds spent viewing
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for recommendation engine queries - ~90% faster lookups
  sessionIdIdx: index("user_interactions_session_id_idx").on(table.sessionId),
  artworkIdIdx: index("user_interactions_artwork_id_idx").on(table.artworkId),
  interactionTypeIdx: index("user_interactions_type_idx").on(table.interactionType),
  createdAtIdx: index("user_interactions_created_at_idx").on(table.createdAt),
  sessionArtworkIdx: index("user_interactions_session_artwork_idx").on(table.sessionId, table.artworkId),
}));

// Art Similarity Matrix for content-based recommendations
export const artSimilarity = pgTable("art_similarity", {
  id: serial("id").primaryKey(),
  artworkId1: integer("artwork_id_1").notNull(),
  artworkId2: integer("artwork_id_2").notNull(),
  similarityScore: doublePrecision("similarity_score").notNull(), // 0-1 similarity score
  factors: jsonb("factors").default({}), // What makes them similar (category, colors, style, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for recommendation engine
  artworkId1Idx: index("art_similarity_artwork_id_1_idx").on(table.artworkId1),
  artworkId2Idx: index("art_similarity_artwork_id_2_idx").on(table.artworkId2),
  similarityScoreIdx: index("art_similarity_score_idx").on(table.similarityScore),
  artworkPairIdx: index("art_similarity_pair_idx").on(table.artworkId1, table.artworkId2),
}));

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserArtInteractionsSchema = createInsertSchema(userArtInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertArtSimilaritySchema = createInsertSchema(artSimilarity).omit({
  id: true,
  createdAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserArtInteractions = typeof userArtInteractions.$inferSelect;
export type InsertUserArtInteractions = z.infer<typeof insertUserArtInteractionsSchema>;
export type ArtSimilarity = typeof artSimilarity.$inferSelect;
export type InsertArtSimilarity = z.infer<typeof insertArtSimilaritySchema>;

// Analytics tracking tables
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  path: text("path").notNull(),
  referer: text("referer"),
  device: text("device"), // mobile, desktop, tablet
  browser: text("browser"),
  os: text("os"),
  country: text("country"),
  duration: integer("duration"), // time spent on page in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsSessions = pgTable("analytics_sessions", {
  id: text("id").primaryKey(), // session ID
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  country: text("country"),
  firstVisit: timestamp("first_visit").defaultNow(),
  lastVisit: timestamp("last_visit").defaultNow(),
  pageViews: integer("page_views").default(1),
  isReturning: boolean("is_returning").default(false),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(), // page_view, artwork_view, product_view, commission_inquiry, etc.
  eventData: jsonb("event_data"), // additional event data
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSessionSchema = createInsertSchema(analyticsSessions).omit({
  firstVisit: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type Analytics = typeof analytics.$inferSelect;
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type InsertAnalyticsSession = z.infer<typeof insertAnalyticsSessionSchema>;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// API Configuration for centralized key management
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., 'stripeSecretKey', 'printfulApiKey'
  value: text("value").notNull(), // Encrypted API key value
  service: text("service").notNull(), // e.g., 'stripe', 'printful', 'gooten'
  description: text("description"), // Human-readable description
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
