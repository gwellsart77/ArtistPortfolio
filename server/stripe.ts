import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { db } from './db';
import { 
  artworks, 
  orders, 
  orderItems, 
  shippingZones, 
  type Order, 
  type Artwork, 
  type OrderItem 
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { DatabaseStorage } from './database-storage';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const storage = new DatabaseStorage();

// Function to create a payment intent for a physical order
export async function createPhysicalOrderPaymentIntent(
  customerId: string,
  customerEmail: string,
  artworkIds: number[],
  shippingZoneId: number,
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  },
  notes?: string
) {
  try {
    // Fetch artwork details
    const artworkList = await Promise.all(
      artworkIds.map(id => storage.getArtworkById(id))
    );
    
    // Filter out any undefined artworks
    const validArtworks = artworkList.filter(a => a) as Artwork[];
    if (validArtworks.length === 0) {
      throw new Error('No valid artworks found in this order');
    }
    
    // Check if any artworks are sold out
    const unavailableArtwork = validArtworks.find(a => !a.available);
    if (unavailableArtwork) {
      throw new Error(`"${unavailableArtwork.title}" is no longer available for purchase`);
    }
    
    // Check limited editions availability
    for (const artwork of validArtworks) {
      if (artwork.isLimitedEdition && artwork.editionSize && artwork.editionsSold >= artwork.editionSize) {
        throw new Error(`Limited edition "${artwork.title}" is sold out`);
      }
    }
    
    // Fetch shipping zone information
    const shippingZone = await storage.getShippingZoneById(shippingZoneId);
    if (!shippingZone) {
      throw new Error('Invalid shipping zone selected');
    }
    
    // Calculate totals
    const subtotal = validArtworks.reduce((sum, artwork) => sum + artwork.price, 0);
    const shippingAmount = shippingZone.rate;
    const totalAmount = subtotal + shippingAmount;
    
    // Format address
    const formattedAddress = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ');
    
    // Create order in the database
    const order = await storage.createOrder({
      customerName: customerId,
      customerEmail: customerEmail,
      shippingAddress: formattedAddress,
      billingAddress: formattedAddress,
      totalAmount: totalAmount * 100, // Convert to cents for Stripe
      shippingAmount: shippingAmount * 100, // Convert to cents for Stripe
      shippingZoneId,
      status: 'pending',
      orderType: 'physical',
      notes: notes || ''
    });
    
    // Add order items
    await Promise.all(
      validArtworks.map(async (artwork) => {
        let editionNumber = null;
        
        // If it's a limited edition, assign the next number in the series
        if (artwork.isLimitedEdition) {
          editionNumber = (artwork.editionsSold || 0) + 1;
          
          // Update the editions sold count
          await storage.updateArtwork(artwork.id, {
            editionsSold: editionNumber
          });
        }
        
        return storage.addOrderItem({
          orderId: order.id,
          artworkId: artwork.id,
          itemType: artwork.isLimitedEdition ? 'limited_edition' : 'artwork',
          quantity: 1,
          unitPrice: artwork.price * 100, // Convert to cents for Stripe
          editionNumber
        });
      })
    );
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to cents for Stripe
      currency: 'usd',
      description: `Order #${order.id} - ${validArtworks.map(a => a.title).join(', ')}`,
      metadata: {
        order_id: order.id.toString(),
        order_type: 'physical'
      },
      receipt_email: customerEmail,
    });
    
    // Update the order with the payment intent ID
    await storage.updateOrderPaymentIntent(order.id, paymentIntent.id);
    
    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    };
  } catch (error) {
    console.error('Error creating payment intent for physical order:', error);
    throw error;
  }
}

// Function to create a payment intent for a digital order
export async function createDigitalOrderPaymentIntent(
  customerId: string,
  customerEmail: string,
  artworkId: number,
  licenseType: 'personal' | 'commercial',
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  },
  notes?: string
) {
  try {
    // Fetch artwork details
    const artwork = await storage.getArtworkById(artworkId);
    if (!artwork) {
      throw new Error('Artwork not found');
    }
    
    // Check if the artwork has a digital version
    if (!artwork.hasDigitalVersion) {
      throw new Error('This artwork is not available as a digital download');
    }
    
    // Determine price based on license type
    let price = 0;
    if (licenseType === 'personal') {
      price = artwork.personalLicensePrice || artwork.digitalPrice || 0;
    } else {
      price = artwork.commercialLicensePrice || (artwork.digitalPrice ? artwork.digitalPrice * 3 : 0);
    }
    
    if (price <= 0) {
      throw new Error('Invalid price for digital artwork');
    }
    
    // Format address for billing
    const formattedAddress = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ');
    
    // Generate a unique download code
    const downloadCode = randomBytes(16).toString('hex');
    
    // Create order in the database
    const order = await storage.createOrder({
      customerName: customerId,
      customerEmail: customerEmail,
      billingAddress: formattedAddress,
      totalAmount: price * 100, // Convert to cents for Stripe
      shippingAmount: 0, // No shipping for digital products
      status: 'pending',
      orderType: 'digital',
      downloadCode,
      downloadExpiresAt: addDays(new Date(), 30), // Link expires after 30 days
      licenseType,
      notes: notes || ''
    });
    
    // Add order item
    await storage.addOrderItem({
      orderId: order.id,
      artworkId: artwork.id,
      itemType: 'digital',
      quantity: 1,
      unitPrice: price * 100, // Convert to cents for Stripe
      licenseType,
      digitalFileUrl: artwork.digitalFileUrl || null
    });
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100, // Convert to cents for Stripe
      currency: 'usd',
      description: `Digital ${licenseType} license for "${artwork.title}"`,
      metadata: {
        order_id: order.id.toString(),
        order_type: 'digital',
        license_type: licenseType
      },
      receipt_email: customerEmail,
    });
    
    // Update the order with the payment intent ID
    await storage.updateOrderPaymentIntent(order.id, paymentIntent.id);
    
    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    };
  } catch (error) {
    console.error('Error creating payment intent for digital order:', error);
    throw error;
  }
}

// Handle Stripe webhook for successful payments
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata.order_id);
        
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }
        
        const order = await storage.getOrderById(orderId);
        if (!order) {
          throw new Error(`Order #${orderId} not found`);
        }
        
        // Update order status
        await storage.updateOrderStatus(orderId, 'processing');
        
        // For digital orders, mark as delivered since they're auto-fulfilled
        if (order.orderType === 'digital') {
          await storage.updateOrderStatus(orderId, 'delivered');
          
          // Send email with download link (in a real implementation)
          // await sendDigitalDownloadEmail(order);
        }
        
        // Update artwork availability for physical items
        const orderItems = await storage.getOrderItems(orderId);
        for (const item of orderItems) {
          if (item.artworkId && (item.itemType === 'artwork' || item.itemType === 'limited_edition')) {
            const artwork = await storage.getArtworkById(item.artworkId);
            if (artwork && !artwork.isLimitedEdition) {
              // Mark original artwork as sold
              await storage.updateArtworkAvailability(item.artworkId, false);
              
              // Also update the artwork status to "sold"
              await storage.updateArtwork(item.artworkId, { status: 'sold' });
              console.log(`Marked artwork ${item.artworkId} as SOLD based on Stripe payment for order ${orderId}`);
            }
          }
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = Number(paymentIntent.metadata.order_id);
        
        if (!orderId) {
          throw new Error('No order ID found in payment intent metadata');
        }
        
        // Update order status
        await storage.updateOrderStatus(orderId, 'cancelled');
        
        // For limited editions, decrement the editions sold count
        const orderItems = await storage.getOrderItems(orderId);
        for (const item of orderItems) {
          if (item.artworkId && item.itemType === 'limited_edition' && item.editionNumber) {
            const artwork = await storage.getArtworkById(item.artworkId);
            if (artwork && artwork.editionsSold && artwork.editionsSold > 0) {
              await storage.updateArtwork(item.artworkId, {
                editionsSold: artwork.editionsSold - 1
              });
            }
          }
        }
        
        break;
      }
    }
    
    return { received: true };
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
}