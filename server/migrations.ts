import { db } from "./db";
import * as schema from "@shared/schema";

/**
 * Run database migrations to ensure all tables exist
 */
export async function runMigrations() {
  console.log("Checking database tables...");
  
  try {
    // Instead of using migrate, we'll use direct schema pushing
    // This is because we're not using file-based migrations in this project
    
    // Create all tables if they don't exist
    
    // This simpler approach ensures tables exist without needing migration files
    let tablesExist = false;
    
    try {
      // Check if users table exists
      const result = await db.execute(`
        SELECT COUNT(*) FROM users LIMIT 1;
      `);
      // If we got here, the table exists
      tablesExist = true;
    } catch (error) {
      // Table doesn't exist, we'll create it
      tablesExist = false;
    }
    console.log('Database check:', tablesExist ? 'Tables exist' : 'Creating tables...');
    
    if (!tablesExist) {
      console.log('Running schema push to create tables...');
      // Push the schema changes - this will create tables if they don't exist
      await db.execute(`
        -- Sessions table for auth
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
        );
        
        -- Create index on sessions
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
        
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          mfa_enabled BOOLEAN DEFAULT FALSE,
          mfa_secret TEXT
        );
        
        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Artworks table
        CREATE TABLE IF NOT EXISTS artworks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          year TEXT NOT NULL,
          medium TEXT NOT NULL,
          dimensions TEXT,
          price INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          featured BOOLEAN DEFAULT FALSE,
          available BOOLEAN DEFAULT TRUE,
          display_order INTEGER DEFAULT 0,
          artist_name TEXT DEFAULT 'Gabe Wells',
          -- For limited edition prints
          is_limited_edition BOOLEAN DEFAULT FALSE,
          edition_size INTEGER,
          editions_sold INTEGER DEFAULT 0,
          limited_edition_price INTEGER,
          -- For digital downloads
          has_digital_version BOOLEAN DEFAULT FALSE,
          digital_file_url TEXT,
          digital_price INTEGER,
          personal_license_price INTEGER,
          commercial_license_price INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Products table
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          price INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          type TEXT NOT NULL,
          available BOOLEAN DEFAULT TRUE,
          stock INTEGER NOT NULL DEFAULT 1,
          artwork_id INTEGER,
          printful_product_id TEXT,
          category TEXT,
          featured BOOLEAN DEFAULT FALSE,
          display_order INTEGER DEFAULT 0,
          seo_title TEXT,
          seo_description TEXT,
          seo_keywords TEXT,
          alt_text TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Contact messages table
        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          subscribe_to_newsletter BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Subscribers table
        CREATE TABLE IF NOT EXISTS subscribers (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Shipping zones table
        CREATE TABLE IF NOT EXISTS shipping_zones (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          base_rate DOUBLE PRECISION NOT NULL,
          additional_item_rate DOUBLE PRECISION NOT NULL,
          active BOOLEAN DEFAULT TRUE
        );
        
        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          shipping_address TEXT,
          billing_address TEXT NOT NULL,
          phone TEXT,
          total_amount INTEGER NOT NULL,
          shipping_amount INTEGER DEFAULT 0,
          shipping_zone_id INTEGER,
          status TEXT NOT NULL DEFAULT 'pending',
          order_type TEXT NOT NULL DEFAULT 'physical',
          payment_intent_id TEXT,
          download_code TEXT,
          download_expires_at TIMESTAMP,
          download_count INTEGER DEFAULT 0,
          license_type TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Order items table
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          product_id INTEGER,
          artwork_id INTEGER,
          item_type TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price INTEGER NOT NULL,
          edition_number INTEGER,
          license_type TEXT,
          digital_file_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }
    
    console.log("✅ Database tables are up-to-date");
    
    // Ensure default settings exist for core functionality
    await ensureDefaultSettings();
    
    // Add e-commerce fields to existing tables if needed
    await migrateEcommerceFields();
    
    // Add SEO fields to artworks table if needed
    await migrateSeoFields();
    
    return true;
  } catch (error) {
    console.error("❌ Database migration error:", error);
    // Continue anyway since tables might still exist
    await ensureDefaultSettings();
    
    // Still try to add e-commerce fields
    try {
      await migrateEcommerceFields();
      // Also try to migrate SEO fields
      await migrateSeoFields();
    } catch (migrationError) {
      console.error("Failed to migrate fields:", migrationError);
    }
    
    return false;
  }
}

/**
 * Migrate tables to add e-commerce fields
 */
async function migrateEcommerceFields() {
  try {
    console.log('Checking and migrating e-commerce fields...');
    
    // Artworks table e-commerce fields
    await migrateArtworkFields();
    
    // Order table e-commerce fields
    await migrateOrderFields();
    
    // Order items table e-commerce fields
    await migrateOrderItemFields();
    
    console.log('E-commerce field migration completed.');
  } catch (error) {
    console.error('Error during e-commerce field migration:', error);
    throw error;
  }
}

/**
 * Add e-commerce related fields to the artworks table
 */
async function migrateArtworkFields() {
  try {
    console.log('Checking artwork table e-commerce fields...');
    
    // Check for display_order column
    if (!await checkColumnExists('artworks', 'display_order')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN display_order INTEGER DEFAULT 0`);
      console.log('Added display_order column to artworks table');
    }
    
    // Check for artist_name column
    if (!await checkColumnExists('artworks', 'artist_name')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN artist_name TEXT DEFAULT 'Gabe Wells'`);
      console.log('Added artist_name column to artworks table');
    }
    
    // Check for limited edition fields
    if (!await checkColumnExists('artworks', 'is_limited_edition')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN is_limited_edition BOOLEAN DEFAULT FALSE`);
      console.log('Added is_limited_edition column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'edition_size')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN edition_size INTEGER`);
      console.log('Added edition_size column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'editions_sold')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN editions_sold INTEGER DEFAULT 0`);
      console.log('Added editions_sold column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'limited_edition_price')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN limited_edition_price INTEGER`);
      console.log('Added limited_edition_price column to artworks table');
      
      // Set default limited edition price to 20% of the original artwork price
      await db.execute(`
        UPDATE artworks 
        SET limited_edition_price = FLOOR(price * 0.2) 
        WHERE limited_edition_price IS NULL
      `);
    }
    
    // Check for limited edition availability column
    if (!await checkColumnExists('artworks', 'limited_edition_available')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN limited_edition_available BOOLEAN DEFAULT TRUE`);
      console.log('Added limited_edition_available column to artworks table');
      
      // Set initial status based on edition size and sold count
      await db.execute(`
        UPDATE artworks 
        SET limited_edition_available = (editions_sold < edition_size OR edition_size IS NULL) 
        WHERE is_limited_edition = TRUE
      `);
    }
    
    // Check for status field (available, sold, unavailable)
    if (!await checkColumnExists('artworks', 'status')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN status TEXT DEFAULT 'available'`);
      console.log('Added status column to artworks table');
      
      // Migrate existing data - set status based on available field
      await db.execute(`
        UPDATE artworks
        SET status = CASE 
          WHEN available = TRUE THEN 'available'
          ELSE 'sold'
        END
      `);
    }
    
    // Make price field nullable for unavailable artworks
    try {
      // Check if price is required
      const priceInfo = await db.execute(`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' AND column_name = 'price'
      `);
      
      const isNullable = priceInfo[0]?.is_nullable === 'YES';
      
      if (!isNullable) {
        await db.execute(`ALTER TABLE artworks ALTER COLUMN price DROP NOT NULL`);
        console.log('Made price field optional in artworks table');
      }
    } catch (err) {
      console.log('Error checking or modifying price column:', err);
    }
    
    // Check for digital download fields
    if (!await checkColumnExists('artworks', 'has_digital_version')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN has_digital_version BOOLEAN DEFAULT FALSE`);
      console.log('Added has_digital_version column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'digital_file_url')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN digital_file_url TEXT`);
      console.log('Added digital_file_url column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'digital_price')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN digital_price INTEGER`);
      console.log('Added digital_price column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'personal_license_price')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN personal_license_price INTEGER`);
      console.log('Added personal_license_price column to artworks table');
    }
    
    if (!await checkColumnExists('artworks', 'commercial_license_price')) {
      await db.execute(`ALTER TABLE artworks ADD COLUMN commercial_license_price INTEGER`);
      console.log('Added commercial_license_price column to artworks table');
      
      // Set default digital pricing where applicable
      await db.execute(`
        UPDATE artworks 
        SET digital_price = FLOOR(price * 0.1),
            personal_license_price = FLOOR(price * 0.1),
            commercial_license_price = FLOOR(price * 0.3)
        WHERE has_digital_version = true AND digital_price IS NULL
      `);
    }
  } catch (error) {
    console.error('Error migrating artwork fields:', error);
    throw error;
  }
}

/**
 * Add e-commerce related fields to the orders table
 */
async function migrateOrderFields() {
  try {
    console.log('Checking order table e-commerce fields...');
    
    // Update shipping_address to be nullable
    await db.execute(`
      ALTER TABLE orders ALTER COLUMN shipping_address DROP NOT NULL;
    `);
    
    // Check for digital order fields
    if (!await checkColumnExists('orders', 'order_type')) {
      await db.execute(`ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'physical'`);
      console.log('Added order_type column to orders table');
    }
    
    if (!await checkColumnExists('orders', 'download_code')) {
      await db.execute(`ALTER TABLE orders ADD COLUMN download_code TEXT`);
      console.log('Added download_code column to orders table');
    }
    
    if (!await checkColumnExists('orders', 'download_expires_at')) {
      await db.execute(`ALTER TABLE orders ADD COLUMN download_expires_at TIMESTAMP`);
      console.log('Added download_expires_at column to orders table');
    }
    
    if (!await checkColumnExists('orders', 'download_count')) {
      await db.execute(`ALTER TABLE orders ADD COLUMN download_count INTEGER DEFAULT 0`);
      console.log('Added download_count column to orders table');
    }
    
    if (!await checkColumnExists('orders', 'license_type')) {
      await db.execute(`ALTER TABLE orders ADD COLUMN license_type TEXT`);
      console.log('Added license_type column to orders table');
    }
  } catch (error) {
    console.error('Error migrating order fields:', error);
    throw error;
  }
}

/**
 * Add e-commerce related fields to the order_items table
 */
async function migrateOrderItemFields() {
  try {
    console.log('Checking order_items table e-commerce fields...');
    
    // Make product_id nullable for artwork orders
    await db.execute(`
      ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;
    `);
    
    // Check for artwork fields
    if (!await checkColumnExists('order_items', 'artwork_id')) {
      await db.execute(`ALTER TABLE order_items ADD COLUMN artwork_id INTEGER`);
      console.log('Added artwork_id column to order_items table');
    }
    
    if (!await checkColumnExists('order_items', 'item_type')) {
      await db.execute(`ALTER TABLE order_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'product'`);
      console.log('Added item_type column to order_items table');
      
      // Set default item type for existing items
      await db.execute(`
        UPDATE order_items 
        SET item_type = 'product' 
        WHERE item_type IS NULL
      `);
    }
    
    if (!await checkColumnExists('order_items', 'edition_number')) {
      await db.execute(`ALTER TABLE order_items ADD COLUMN edition_number INTEGER`);
      console.log('Added edition_number column to order_items table');
    }
    
    if (!await checkColumnExists('order_items', 'license_type')) {
      await db.execute(`ALTER TABLE order_items ADD COLUMN license_type TEXT`);
      console.log('Added license_type column to order_items table');
    }
    
    if (!await checkColumnExists('order_items', 'digital_file_url')) {
      await db.execute(`ALTER TABLE order_items ADD COLUMN digital_file_url TEXT`);
      console.log('Added digital_file_url column to order_items table');
    }
  } catch (error) {
    console.error('Error migrating order_item fields:', error);
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = '${columnName}'
    `);
    
    return (result as any).rowCount > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
    return false;
  }
}

/**
 * Add SEO fields to the artworks table
 */
async function migrateSeoFields() {
  try {
    console.log("Checking artworks table for SEO fields...");
    
    // Use db from drizzle instead of pool
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'artworks' AND column_name = 'seo_title'
      );
    `);
    
    const seoTitleExists = result[0]?.exists || false;
    
    if (!seoTitleExists) {
      console.log("Adding SEO fields to artworks table...");
      
      // Add SEO fields to artworks table using db from drizzle
      await db.execute(`
        ALTER TABLE artworks
        ADD COLUMN IF NOT EXISTS seo_title TEXT,
        ADD COLUMN IF NOT EXISTS seo_description TEXT,
        ADD COLUMN IF NOT EXISTS alt_text TEXT;
      `);
      
      console.log("✅ SEO fields added to artworks table");
    } else {
      console.log("SEO fields already exist in artworks table");
    }
    
    // Check products table for SEO fields
    console.log("Checking products table for SEO fields...");
    
    const productResult = await db.execute(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'seo_title'
      );
    `);
    
    const productSeoTitleExists = productResult[0]?.exists || false;
    
    if (!productSeoTitleExists) {
      console.log("Adding SEO fields to products table...");
      
      // Add SEO fields to products table using db from drizzle
      await db.execute(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS seo_title TEXT,
        ADD COLUMN IF NOT EXISTS seo_description TEXT,
        ADD COLUMN IF NOT EXISTS alt_text TEXT;
      `);
      
      console.log("✅ SEO fields added to products table");
    } else {
      console.log("SEO fields already exist in products table");
    }
    
    // Check products table for dimension fields (for price calculator)
    console.log("Checking products table for dimension fields...");
    
    const dimensionResult = await db.execute(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'height'
      );
    `);
    
    const heightExists = dimensionResult[0]?.exists || false;
    
    if (!heightExists) {
      console.log("Adding dimension fields to products table...");
      
      // Add height and width fields to products table
      await db.execute(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS width DOUBLE PRECISION;
      `);
      
      console.log("✅ Dimension fields added to products table");
    } else {
      console.log("Dimension fields already exist in products table");
    }
    
    // Check products table for limited edition fields
    console.log("Checking products table for limited edition fields...");
    
    const limitedEditionResult = await db.execute(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_limited_edition'
      );
    `);
    
    const limitedEditionExists = limitedEditionResult[0]?.exists || false;
    
    if (!limitedEditionExists) {
      console.log("Adding limited edition fields to products table...");
      
      // Add limited edition fields to products table
      await db.execute(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS edition_size INTEGER,
        ADD COLUMN IF NOT EXISTS edition_number INTEGER;
      `);
      
      console.log("✅ Limited edition fields added to products table");
    } else {
      console.log("Limited edition fields already exist in products table");
    }

    // Check if product_variants table exists
    console.log("Checking product_variants table...");
    
    const variantsTableResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_variants'
      );
    `);
    
    const variantsTableExists = variantsTableResult[0]?.exists || false;
    
    if (!variantsTableExists) {
      console.log("Creating product_variants table...");
      
      try {
        await db.execute(`
          CREATE TABLE product_variants (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL,
            variant_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            stock INTEGER DEFAULT 999,
            printful_variant_id TEXT,
            available BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE
          );
        `);
        console.log("✅ Product variants table created");
      } catch (createError: any) {
        if (createError.code === '42P07') {
          console.log("Product variants table already exists");
        } else {
          throw createError;
        }
      }
    } else {
      console.log("Product variants table already exists");
    }

    // Check if merchandise_types table exists
    console.log("Checking merchandise_types table...");
    
    const merchandiseTypesTableResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'merchandise_types'
      );
    `);
    
    const merchandiseTypesTableExists = merchandiseTypesTableResult[0]?.exists || false;
    
    if (!merchandiseTypesTableExists) {
      console.log("Creating merchandise_types table...");
      
      try {
        await db.execute(`
          CREATE TABLE merchandise_types (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Insert default merchandise types
        await db.execute(`
          INSERT INTO merchandise_types (name, description, display_order) VALUES
          ('Stickers', 'Adhesive stickers and decals', 1),
          ('Hats', 'Caps, beanies, and other headwear', 2),
          ('Buttons', 'Pin buttons and badges', 3);
        `);
        
        console.log("✅ Merchandise types table created with default types");
      } catch (createError: any) {
        if (createError.code === '42P07') {
          console.log("Merchandise types table already exists");
        } else {
          throw createError;
        }
      }
    } else {
      console.log("Merchandise types table already exists");
    }

    // Check if original_types table exists
    console.log("Checking original_types table...");
    
    const originalTypesTableResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'original_types'
      );
    `);
    
    const originalTypesTableExists = originalTypesTableResult[0]?.exists || false;
    
    if (!originalTypesTableExists) {
      console.log("Creating original_types table...");
      
      try {
        await db.execute(`
          CREATE TABLE original_types (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Insert default original types
        await db.execute(`
          INSERT INTO original_types (name, description, display_order) VALUES
          ('Paintings', 'Original paintings and artworks', 1),
          ('Sculptures', 'Three-dimensional sculptural works', 2),
          ('Drawings', 'Original drawings and sketches', 3);
        `);
        
        console.log("✅ Original types table created with default types");
      } catch (createError: any) {
        if (createError.code === '42P07') {
          console.log("Original types table already exists");
        } else {
          throw createError;
        }
      }
    } else {
      console.log("Original types table already exists");
    }
  } catch (error) {
    console.error('Error migrating product fields:', error);
    throw error;
  }
}

/**
 * Ensure critical default settings exist in the database
 */
async function ensureDefaultSettings() {
  // Define non-credential settings first
  const nonCredentialSettings = [
    {
      key: "home_hero_heading",
      value: "Gabe Wells Fine Art",
      description: "Main heading on the home page"
    },
    {
      key: "home_hero_subheading",
      value: "Contemporary oil paintings that explore the boundaries between reality and abstraction",
      description: "Subheading on the home page"
    },
    {
      key: "home_hero_image",
      value: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=900",
      description: "URL for the home page hero banner image"
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
      key: "social_instagram",
      value: "https://instagram.com/gabewellsart",
      description: "Instagram profile URL"
    },
    {
      key: "price_per_square_inch",
      value: "2.50",
      description: "Price multiplier per square inch for original artwork pricing (in dollars)"
    },
    {
      key: "about_bio",
      value: "Gabe Wells is a contemporary artist based in Portland, Oregon, whose work explores the boundaries between reality and the subconscious. Working primarily in oil and mixed media, Wells creates pieces that blend everyday scenes with elements of the fantastical and unexpected.",
      description: "Artist biography for the About page"
    }
  ];

  // Define credential settings separately - these will ONLY be created if they don't exist
  const credentialSettings = [
    {
      key: "admin_username",
      value: "admin",
      description: "Admin username for login"
    },
    {
      key: "admin_password",
      value: "password",
      description: "Admin password for login"
    }
  ];

  // Check if each non-credential setting exists, and create if missing
  for (const setting of nonCredentialSettings) {
    const existingSetting = await db.query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, setting.key)
    });
    
    if (!existingSetting) {
      console.log(`Creating default setting: ${setting.key}`);
      await db.insert(schema.settings).values(setting);
    }
  }
  
  // Handle credential settings - these are the admin username and password
  // Check if admin credentials already exist in the database
  for (const credSetting of credentialSettings) {
    const existingCredential = await db.query.settings.findFirst({
      where: (s, { eq }) => eq(s.key, credSetting.key)
    });
    
    // Only create default admin credentials if they don't exist yet
    if (!existingCredential) {
      console.log(`Creating initial credential setting: ${credSetting.key}`);
      await db.insert(schema.settings).values(credSetting);
    } else {
      console.log(`Credential setting already exists: ${credSetting.key}`);
    }
  }
}