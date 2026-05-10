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
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  ApiConfiguration,
  InsertApiConfiguration,
  EmailTemplate,
  InsertEmailTemplate
} from "@shared/schema";

// Modify the interface with any CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserMfaStatus(id: number, enabled: boolean, secret?: string): Promise<User | undefined>;
  updateUserCredentials(id: number, username: string, password: string): Promise<User | undefined>;

  // Artwork methods
  getAllArtworks(): Promise<Artwork[]>;
  getArtworkById(id: number): Promise<Artwork | undefined>;
  getArtworksByCategory(category: string): Promise<Artwork[]>;
  getFeaturedArtworks(): Promise<Artwork[]>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtworkAvailability(id: number, available: boolean): Promise<Artwork | undefined>;
  updateArtwork(id: number, artworkData: Partial<InsertArtwork>): Promise<Artwork | undefined>;
  deleteArtwork(id: number): Promise<boolean>;

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByType(type: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductAvailability(id: number, available: boolean): Promise<Product | undefined>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductDimensions(productId: number, height: number, width: number): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Contact methods
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  
  // Newsletter methods
  addSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  
  // Settings methods
  getSetting(key: string): Promise<Settings | undefined>;
  getAllSettings(): Promise<Settings[]>;
  upsertSetting(setting: InsertSettings): Promise<Settings>;
  
  // Product stock methods
  updateProductStock(id: number, quantity: number): Promise<Product | undefined>;
  
  // Shipping methods
  createShippingZone(zone: InsertShippingZone): Promise<ShippingZone>;
  getShippingZoneById(id: number): Promise<ShippingZone | undefined>;
  getAllShippingZones(): Promise<ShippingZone[]>;
  getActiveShippingZones(): Promise<ShippingZone[]>;
  updateShippingZone(id: number, data: Partial<InsertShippingZone>): Promise<ShippingZone | undefined>;
  deleteShippingZone(id: number): Promise<boolean>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPaymentIntent(id: number, paymentIntentId: string): Promise<Order | undefined>;
  updateOrderNotes(id: number, notes: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  
  // Order items methods
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItemsWithProductDetails(orderId: number): Promise<Array<OrderItem & { productDetails: Product }>>;

  // Print-on-demand order management methods
  getPendingPrintfulOrders(): Promise<Order[]>;
  getPendingGootenOrders(): Promise<Order[]>;
  getAllPendingPrintOrders(): Promise<{ printful: Order[], gooten: Order[] }>;
  updateOrder(orderId: number, updates: Partial<Order>): Promise<Order>;
  getOrder(orderId: number): Promise<Order | undefined>;

  // API Configuration methods
  getAllApiConfigs(): Promise<ApiConfiguration[]>;
  getApiConfig(key: string): Promise<ApiConfiguration | undefined>;
  setApiConfig(key: string, value: string, service?: string, description?: string): Promise<ApiConfiguration>;
  updateApiConfig(key: string, value: string): Promise<ApiConfiguration | undefined>;
  deleteApiConfig(key: string): Promise<boolean>;

  // Email Template methods
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(templateKey: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artworks: Map<number, Artwork>;
  private products: Map<number, Product>;
  private contactMessages: Map<number, ContactMessage>;
  private subscribers: Map<number, Subscriber>;
  private settings: Map<number, Settings>;
  private shippingZones: Map<number, ShippingZone>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private userCurrentId: number;
  private artworkCurrentId: number;
  private productCurrentId: number;
  private contactMessageCurrentId: number;
  private subscriberCurrentId: number;
  private settingsCurrentId: number;
  private shippingZoneCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.artworks = new Map();
    this.products = new Map();
    this.contactMessages = new Map();
    this.subscribers = new Map();
    this.settings = new Map();
    this.shippingZones = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userCurrentId = 1;
    this.artworkCurrentId = 1;
    this.productCurrentId = 1;
    this.contactMessageCurrentId = 1;
    this.subscriberCurrentId = 1;
    this.settingsCurrentId = 1;
    this.shippingZoneCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      mfaEnabled: false,
      mfaSecret: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserMfaStatus(id: number, enabled: boolean, secret?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      mfaEnabled: enabled,
      mfaSecret: enabled ? (secret || user.mfaSecret) : null
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserCredentials(id: number, username: string, password: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Check if username already exists (excluding the current user)
    const existingUser = Array.from(this.users.values()).find(
      u => u.username === username && u.id !== id
    );
    
    if (existingUser) {
      throw new Error('Username already taken');
    }
    
    const updatedUser: User = {
      ...user,
      username,
      password
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Artwork methods
  async getAllArtworks(): Promise<Artwork[]> {
    return Array.from(this.artworks.values());
  }

  async getArtworkById(id: number): Promise<Artwork | undefined> {
    return this.artworks.get(id);
  }

  async getArtworksByCategory(category: string): Promise<Artwork[]> {
    return Array.from(this.artworks.values()).filter(
      (artwork) => artwork.category === category,
    );
  }

  async getFeaturedArtworks(): Promise<Artwork[]> {
    return Array.from(this.artworks.values()).filter(
      (artwork) => artwork.featured,
    );
  }

  async updateArtworkAvailability(id: number, available: boolean): Promise<Artwork | undefined> {
    const artwork = this.artworks.get(id);
    if (!artwork) {
      return undefined;
    }
    
    const updatedArtwork = { ...artwork, available };
    this.artworks.set(id, updatedArtwork);
    return updatedArtwork;
  }
  
  async updateArtwork(id: number, artworkData: Partial<InsertArtwork>): Promise<Artwork | undefined> {
    const artwork = this.artworks.get(id);
    if (!artwork) {
      return undefined;
    }
    
    const updatedArtwork = { ...artwork, ...artworkData };
    this.artworks.set(id, updatedArtwork);
    return updatedArtwork;
  }
  
  async deleteArtwork(id: number): Promise<boolean> {
    if (!this.artworks.has(id)) {
      return false;
    }
    
    return this.artworks.delete(id);
  }

  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const id = this.artworkCurrentId++;
    const now = new Date();
    // Ensure we have values for all required fields
    const artwork: Artwork = { 
      id,
      title: insertArtwork.title,
      description: insertArtwork.description,
      category: insertArtwork.category,
      year: insertArtwork.year,
      medium: insertArtwork.medium,
      dimensions: insertArtwork.dimensions || null,
      price: insertArtwork.price ?? null,
      imageUrl: insertArtwork.imageUrl,
      featured: insertArtwork.featured || null,
      available: insertArtwork.available || null,
      createdAt: now 
    };
    this.artworks.set(id, artwork);
    return artwork;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByType(type: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.type === type,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const now = new Date();
    // Ensure we have values for all required fields
    const product: Product = { 
      id,
      title: insertProduct.title,
      description: insertProduct.description,
      price: insertProduct.price,
      imageUrl: insertProduct.imageUrl,
      type: insertProduct.type,
      available: insertProduct.available || null,
      stock: insertProduct.stock || 0,
      artworkId: insertProduct.artworkId || null,
      createdAt: now 
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProductAvailability(id: number, available: boolean): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, available };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Contact methods
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageCurrentId++;
    const now = new Date();
    const message: ContactMessage = { ...insertMessage, id, createdAt: now };
    this.contactMessages.set(id, message);
    return message;
  }

  // Newsletter methods
  async addSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const existingSubscriber = await this.getSubscriberByEmail(insertSubscriber.email);
    if (existingSubscriber) {
      return existingSubscriber;
    }
    
    const id = this.subscriberCurrentId++;
    const now = new Date();
    const subscriber: Subscriber = { ...insertSubscriber, id, createdAt: now };
    this.subscribers.set(id, subscriber);
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(
      (subscriber) => subscriber.email === email,
    );
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Settings | undefined> {
    // Find setting by key
    return Array.from(this.settings.values()).find(
      (setting) => setting.key === key,
    );
  }
  
  async getAllSettings(): Promise<Settings[]> {
    return Array.from(this.settings.values());
  }
  
  async upsertSetting(settingData: InsertSettings): Promise<Settings> {
    // Check if setting with this key already exists
    const existingSetting = await this.getSetting(settingData.key);
    
    if (existingSetting) {
      // Update existing setting
      const updatedSetting: Settings = { 
        ...existingSetting, 
        value: settingData.value,
        description: settingData.description || existingSetting.description,
        updatedAt: new Date()
      };
      
      this.settings.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    } else {
      // Create new setting
      const id = this.settingsCurrentId++;
      const now = new Date();
      const setting: Settings = { 
        ...settingData, 
        id, 
        updatedAt: now
      };
      
      this.settings.set(id, setting);
      return setting;
    }
  }

  // Initialize with sample data
  private initializeData() {
    // Initialize shipping zones with USPS rates
    const shippingZonesData: InsertShippingZone[] = [
      {
        name: "Domestic - Zone 1 (Local)",
        description: "Up to 50 miles from Denver",
        baseRate: 7.95,
        additionalItemRate: 2.50,
        active: true
      },
      {
        name: "Domestic - Zone 2 (Regional)",
        description: "51-300 miles from Denver",
        baseRate: 9.95,
        additionalItemRate: 3.75,
        active: true
      },
      {
        name: "Domestic - Zone 3 (National)",
        description: "301+ miles within continental US",
        baseRate: 12.95,
        additionalItemRate: 4.95,
        active: true
      },
      {
        name: "International - Zone 1",
        description: "Canada and Mexico",
        baseRate: 24.95,
        additionalItemRate: 12.95,
        active: true
      },
      {
        name: "International - Zone 2",
        description: "Rest of World",
        baseRate: 34.95,
        additionalItemRate: 17.95,
        active: true
      }
    ];
    
    // Add shipping zones to storage
    shippingZonesData.forEach(zone => {
      this.createShippingZone(zone);
    });
    
    // Initialize settings
    const settingsData: InsertSettings[] = [
      {
        key: "home_hero_image",
        value: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=900",
        description: "URL for the home page hero banner image"
      },
      {
        key: "home_hero_heading",
        value: "Gabe Wells | Fine Art",
        description: "Main heading for the home page hero section"
      },
      {
        key: "home_hero_subheading",
        value: "Exploring magical realism and sculptural forms through oil and mixed media",
        description: "Subheading for the home page hero section"
      },
      {
        key: "home_featured_heading",
        value: "Featured Works",
        description: "Heading for the featured artworks section"
      },
      {
        key: "home_featured_description",
        value: "Explore a selection of my latest and most significant pieces, showcasing the intersection of reality and imagination.",
        description: "Description text for the featured artworks section"
      },
      {
        key: "about_bio",
        value: "Gabe Wells is a contemporary artist based in Portland, Oregon, whose work explores the boundaries between reality and the subconscious. Working primarily in oil and mixed media, Wells creates pieces that blend everyday scenes with elements of the fantastical and unexpected. His Magical Realism works are characterized by vivid colors and dreamlike compositions, while his sculptural pieces examine themes of time, memory, and transformation.\n\nWells received his MFA from the Pacific Northwest College of Art in 2015 and has exhibited work in galleries throughout the United States and Europe. His pieces are held in several private collections and have been featured in publications including Modern Art Review and Northwest Arts Quarterly.",
        description: "Artist biography for the About page"
      },
      {
        key: "about_image",
        value: "https://images.unsplash.com/photo-1581281567081-aaa3eda3290e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000",
        description: "URL for the artist image on the About page"
      },
      {
        key: "about_statement",
        value: "My work explores the liminal spaces between perceived reality and the subconscious mind. I'm fascinated by the ways in which ordinary environments can be transformed through subtle shifts in perspective or context, revealing the extraordinary that lies just beneath the surface of everyday experience.\n\nThrough my art, I seek to create visual narratives that invite viewers to question their assumptions about the world around them and consider alternative ways of seeing and understanding.",
        description: "Artist statement for the About page"
      },
      {
        key: "social_instagram",
        value: "https://instagram.com/gabewellsart",
        description: "Artist's Instagram profile URL"
      },
      {
        key: "use_printful",
        value: "false",
        description: "Enable Printful integration for print-on-demand products"
      },
      {
        key: "studio_address_private",
        value: "602 W 2nd Ave, Denver, CO 80223",
        description: "Artist's full studio address (PRIVATE - not displayed on website)"
      },
      {
        key: "studio_location_public",
        value: "Denver, CO",
        description: "Artist's studio location for public display"
      },
      // Shipping settings
      {
        key: "shipping_studio_address",
        value: "602 W 2nd Ave, Denver, CO 80223",
        description: "Artist's studio shipping address (private)"
      },
      {
        key: "shipping_use_drop_shipping",
        value: "false",
        description: "Whether to use drop shipping"
      },
      {
        key: "shipping_drop_address",
        value: "",
        description: "Drop shipping address when not shipping from studio"
      },
      {
        key: "shipping_origin",
        value: "studio",
        description: "Current shipping origin (studio or drop)"
      },
      {
        key: "shipping_contact_name",
        value: "Gabe Wells",
        description: "Shipping contact name"
      },
      {
        key: "shipping_contact_email",
        value: "",
        description: "Shipping contact email"
      },
      {
        key: "shipping_contact_phone",
        value: "",
        description: "Shipping contact phone"
      }
    ];
    
    // Add settings to storage
    settingsData.forEach(setting => {
      this.upsertSetting(setting);
    });
    
    // Sample artworks and products initialization
    const artworksData: InsertArtwork[] = [
      {
        title: "Dreamscape Echoes",
        description: "A vibrant exploration of magical realism, where everyday scenes transform into extraordinary visions.",
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        dimensions: "24 x 36 inches",
        medium: "Oil on canvas",
        year: "2023",
        category: "magical-realism",
        available: true,
        featured: true
      },
      {
        title: "Temporal Fragments",
        description: "A series of interconnected sculptural elements that explore the concept of time and memory.",
        price: 1800,
        imageUrl: "https://images.unsplash.com/photo-1576773689115-5cd2b0223523?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        dimensions: "18 x 24 x 12 inches",
        medium: "Mixed media sculpture",
        year: "2022",
        category: "sculpture",
        available: true,
        featured: true
      },
      {
        title: "Cosmic Resonance",
        description: "Abstract figurative work exploring the connection between human form and universal energies.",
        price: 950,
        imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        dimensions: "30 x 40 inches",
        medium: "Acrylic on canvas",
        year: "2023",
        category: "figurative",
        available: true,
        featured: false
      }
    ];
    
    // Add artworks to storage
    artworksData.forEach(artwork => {
      const now = new Date();
      const id = this.artworkCurrentId++;
      const completeArtwork: Artwork = {
        ...artwork,
        id,
        createdAt: now
      };
      this.artworks.set(id, completeArtwork);
    });
    
    // Sample products
    const productsData: InsertProduct[] = [
      {
        title: "Dreamscape Echoes - Limited Edition Print",
        description: "High-quality archival print of the original painting. Signed and numbered by the artist.",
        price: 150,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        type: "prints",
        available: true,
        stock: 25,
        artworkId: null
      },
      {
        title: "Cosmic Resonance - Original Painting",
        description: "Original acrylic painting on stretched canvas with certificate of authenticity.",
        price: 950,
        imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        type: "originals",
        available: true,
        stock: 1,
        artworkId: null
      },
      {
        title: "Artist Studio Tote Bag",
        description: "Durable canvas tote featuring artwork from Gabe Wells' studio collection.",
        price: 35,
        imageUrl: "https://images.unsplash.com/photo-1597484662317-c93a6f207ff7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        type: "merchandise",
        available: true,
        stock: 50,
        artworkId: null
      }
    ];
    
    // Add products to storage
    productsData.forEach(product => {
      const now = new Date();
      const id = this.productCurrentId++;
      const completeProduct: Product = {
        id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        type: product.type,
        available: product.available || null,
        stock: product.stock || 0,
        artworkId: product.artworkId || null,
        createdAt: now
      };
      this.products.set(id, completeProduct);
    });
  }
  
  // Product stock methods
  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // Ensure stock doesn't go below 0
    const newStock = Math.max(0, quantity);
    const updatedProduct = { ...product, stock: newStock };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  // Shipping methods
  async createShippingZone(zone: InsertShippingZone): Promise<ShippingZone> {
    const id = this.shippingZoneCurrentId++;
    const shippingZone: ShippingZone = { ...zone, id };
    this.shippingZones.set(id, shippingZone);
    return shippingZone;
  }
  
  async getShippingZoneById(id: number): Promise<ShippingZone | undefined> {
    return this.shippingZones.get(id);
  }
  
  async getAllShippingZones(): Promise<ShippingZone[]> {
    return Array.from(this.shippingZones.values());
  }
  
  async getActiveShippingZones(): Promise<ShippingZone[]> {
    return Array.from(this.shippingZones.values()).filter(
      zone => zone.active
    );
  }
  
  async updateShippingZone(id: number, data: Partial<InsertShippingZone>): Promise<ShippingZone | undefined> {
    const zone = this.shippingZones.get(id);
    if (!zone) return undefined;
    
    const updatedZone = { ...zone, ...data };
    this.shippingZones.set(id, updatedZone);
    return updatedZone;
  }
  
  async deleteShippingZone(id: number): Promise<boolean> {
    return this.shippingZones.delete(id);
  }
  
  // Order methods
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const now = new Date();
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.orders.set(id, order);
    return order;
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const now = new Date();
    const updatedOrder = { 
      ...order, 
      status, 
      updatedAt: now 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateOrderPaymentIntent(id: number, paymentIntentId: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const now = new Date();
    const updatedOrder = { 
      ...order, 
      paymentIntentId, 
      updatedAt: now 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateOrderNotes(id: number, notes: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const now = new Date();
    const updatedOrder = { 
      ...order, 
      notes, 
      updatedAt: now 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersByEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.customerEmail === email
    );
  }
  
  // Order items methods
  async addOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemCurrentId++;
    const now = new Date();
    const orderItem: OrderItem = { ...item, id, createdAt: now };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      item => item.orderId === orderId
    );
  }
  
  async getOrderItemsWithProductDetails(orderId: number): Promise<Array<OrderItem & { productDetails: Product }>> {
    const items = await this.getOrderItems(orderId);
    return items.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      return { ...item, productDetails: product };
    });
  }
  
}

// Import the database storage implementation
import { DatabaseStorage } from './database-storage';

// Use DatabaseStorage instead of MemStorage for data persistence
export const storage = new DatabaseStorage();
