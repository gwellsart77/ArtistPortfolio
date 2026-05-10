import { log } from './vite';
import axios from 'axios';

// Shipstation API integration
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY || '';
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET || '';
const SHIPSTATION_STORE_ID = process.env.SHIPSTATION_STORE_ID || '';
const SHIPSTATION_WEBHOOK_URL = process.env.SHIPSTATION_WEBHOOK_URL || '';

if (!SHIPSTATION_API_KEY) {
  console.warn('Missing SHIPSTATION_API_KEY environment variable');
}

if (!SHIPSTATION_API_SECRET) {
  console.warn('Missing SHIPSTATION_API_SECRET environment variable');
}

log('Initializing Shipstation API client', 'shipstation');

// Setup axios instance for Shipstation API calls
const shipstationApi = axios.create({
  baseURL: 'https://ssapi.shipstation.com',
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: SHIPSTATION_API_KEY,
    password: SHIPSTATION_API_SECRET
  }
});

// Add request logging
shipstationApi.interceptors.request.use((config) => {
  log(`Shipstation API request: ${config.method?.toUpperCase()} ${config.url}`, 'shipstation');
  return config;
});

// Test connection to Shipstation API
export async function testShipstationConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    log('Testing Shipstation API connection', 'shipstation');
    
    // Test with a simple stores endpoint
    const response = await shipstationApi.get('/stores');
    
    log('Shipstation connection test successful', 'shipstation');
    return {
      success: true,
      message: 'Successfully connected to Shipstation API',
      data: {
        storeCount: response.data.stores?.length || 0,
        stores: response.data.stores?.map((store: any) => ({
          storeId: store.storeId,
          storeName: store.storeName,
          marketplaceId: store.marketplaceId
        })) || []
      }
    };
  } catch (error: any) {
    log(`Shipstation connection test failed: ${error.message}`, 'shipstation');
    return {
      success: false,
      message: `Failed to connect to Shipstation: ${error.message}`,
      data: error.response?.data
    };
  }
}

// Get available stores from Shipstation
export async function getShipstationStores() {
  try {
    log('Fetching Shipstation stores', 'shipstation');
    const response = await shipstationApi.get('/stores');
    return response.data.stores;
  } catch (error) {
    console.error('Error fetching Shipstation stores:', error);
    throw error;
  }
}

// Get products from Shipstation store
export async function getShipstationProducts(storeId?: string) {
  try {
    log('Fetching products via Shipstation', 'shipstation');
    
    const params: any = {};
    if (storeId) {
      params.storeId = storeId;
    }
    
    const response = await shipstationApi.get('/products', { params });
    return response.data.products || [];
  } catch (error) {
    console.error('Error fetching Shipstation products:', error);
    throw error;
  }
}

// Create an order in Shipstation
export async function createShipstationOrder(orderData: any) {
  try {
    log('Creating order via Shipstation', 'shipstation');
    
    // Format order data for Shipstation API
    const shipstationOrder = {
      orderNumber: orderData.orderNumber,
      orderDate: orderData.orderDate || new Date().toISOString(),
      orderStatus: "awaiting_shipment",
      storeId: orderData.storeId || SHIPSTATION_STORE_ID,
      customerUsername: orderData.customer?.email,
      customerEmail: orderData.customer?.email,
      billTo: {
        name: orderData.billingAddress?.name,
        company: orderData.billingAddress?.company || null,
        street1: orderData.billingAddress?.street1,
        street2: orderData.billingAddress?.street2 || null,
        street3: orderData.billingAddress?.street3 || null,
        city: orderData.billingAddress?.city,
        state: orderData.billingAddress?.state,
        postalCode: orderData.billingAddress?.postalCode,
        country: orderData.billingAddress?.country,
        phone: orderData.billingAddress?.phone || null,
        residential: orderData.billingAddress?.residential || true
      },
      shipTo: {
        name: orderData.shippingAddress?.name,
        company: orderData.shippingAddress?.company || null,
        street1: orderData.shippingAddress?.street1,
        street2: orderData.shippingAddress?.street2 || null,
        street3: orderData.shippingAddress?.street3 || null,
        city: orderData.shippingAddress?.city,
        state: orderData.shippingAddress?.state,
        postalCode: orderData.shippingAddress?.postalCode,
        country: orderData.shippingAddress?.country,
        phone: orderData.shippingAddress?.phone || null,
        residential: orderData.shippingAddress?.residential || true
      },
      items: orderData.items?.map((item: any) => ({
        lineItemKey: item.lineItemKey || `${item.sku}-${Date.now()}`,
        sku: item.sku,
        name: item.name,
        imageUrl: item.imageUrl || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount || null,
        shippingAmount: item.shippingAmount || null,
        warehouseLocation: item.warehouseLocation || null,
        options: item.options || [],
        productId: item.productId || null,
        fulfillmentSku: item.fulfillmentSku || item.sku
      })) || [],
      amountPaid: orderData.amountPaid || 0,
      taxAmount: orderData.taxAmount || 0,
      shippingAmount: orderData.shippingAmount || 0,
      customerNotes: orderData.customerNotes || null,
      internalNotes: orderData.internalNotes || null,
      gift: orderData.gift || false,
      giftMessage: orderData.giftMessage || null,
      paymentMethod: orderData.paymentMethod || 'Credit Card',
      requestedShippingService: orderData.requestedShippingService || 'USPS Priority Mail',
      carrierCode: orderData.carrierCode || 'usps',
      serviceCode: orderData.serviceCode || 'usps_priority_mail',
      packageCode: orderData.packageCode || 'package',
      confirmation: orderData.confirmation || 'none',
      shipDate: orderData.shipDate || null,
      holdUntilDate: orderData.holdUntilDate || null
    };
    
    const response = await shipstationApi.post('/orders/createorder', shipstationOrder);
    
    log(`Shipstation order created: ${response.data.orderId}`, 'shipstation');
    return response.data;
  } catch (error) {
    console.error('Error creating Shipstation order:', error);
    throw error;
  }
}

// Get order status from Shipstation
export async function getShipstationOrderStatus(orderId: string) {
  try {
    log(`Getting order status for order: ${orderId}`, 'shipstation');
    
    const response = await shipstationApi.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting Shipstation order status:', error);
    throw error;
  }
}

// Cancel an order in Shipstation
export async function cancelShipstationOrder(orderId: string) {
  try {
    log(`Cancelling order: ${orderId}`, 'shipstation');
    
    // Mark order as cancelled by updating status
    const response = await shipstationApi.post('/orders/markasshipped', {
      orderId: orderId,
      carrierCode: 'other',
      shipDate: new Date().toISOString(),
      trackingNumber: 'CANCELLED',
      notifyCustomer: false,
      notifySalesChannel: false
    });
    
    return response.data;
  } catch (error) {
    console.error('Error cancelling Shipstation order:', error);
    throw error;
  }
}

// Process webhook from Shipstation
export async function processShipstationWebhook(webhookData: any) {
  try {
    log('Processing Shipstation webhook', 'shipstation');
    log(`Webhook data: ${JSON.stringify(webhookData)}`, 'shipstation');
    
    // Webhook data structure from Shipstation:
    // {
    //   "resource_url": "string",
    //   "resource_type": "ORDER_NOTIFY", // or "ITEM_ORDER_NOTIFY", "SHIP_NOTIFY", etc.
    //   "order_number": "string",
    //   "order_id": number,
    //   "store_id": number,
    //   "tracking_number": "string", // when shipped
    //   "carrier_code": "string", // when shipped
    //   "ship_date": "string" // when shipped
    // }
    
    if (webhookData.resource_type === 'SHIP_NOTIFY') {
      // Order has been shipped
      log(`Order ${webhookData.order_number} shipped with tracking: ${webhookData.tracking_number}`, 'shipstation');
      
      return {
        type: 'order_shipped',
        orderId: webhookData.order_id,
        orderNumber: webhookData.order_number,
        trackingNumber: webhookData.tracking_number,
        carrier: webhookData.carrier_code,
        shipDate: webhookData.ship_date
      };
    } else if (webhookData.resource_type === 'ORDER_NOTIFY') {
      // General order notification
      log(`Order notification for ${webhookData.order_number}`, 'shipstation');
      
      return {
        type: 'order_update',
        orderId: webhookData.order_id,
        orderNumber: webhookData.order_number
      };
    }
    
    return {
      type: 'unknown',
      data: webhookData
    };
  } catch (error) {
    console.error('Error processing Shipstation webhook:', error);
    throw error;
  }
}

// Get shipping rates from Shipstation
export async function getShipstationShippingRates(params: {
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  fromPostalCode: string;
  toState: string;
  toCountry: string;
  toPostalCode: string;
  toCity: string;
  weight: {
    value: number;
    units: 'ounces' | 'pounds' | 'grams' | 'kilograms';
  };
  dimensions?: {
    units: 'inches' | 'centimeters';
    length: number;
    width: number;
    height: number;
  };
}) {
  try {
    log('Getting shipping rates via Shipstation', 'shipstation');
    
    const response = await shipstationApi.post('/shipments/getrates', params);
    return response.data;
  } catch (error) {
    console.error('Error getting Shipstation shipping rates:', error);
    throw error;
  }
}

// Get carriers from Shipstation
export async function getShipstationCarriers() {
  try {
    log('Getting carriers from Shipstation', 'shipstation');
    
    const response = await shipstationApi.get('/carriers');
    return response.data;
  } catch (error) {
    console.error('Error getting Shipstation carriers:', error);
    throw error;
  }
}

export default {
  testShipstationConnection,
  getShipstationStores,
  getShipstationProducts,
  createShipstationOrder,
  getShipstationOrderStatus,
  cancelShipstationOrder,
  processShipstationWebhook,
  getShipstationShippingRates,
  getShipstationCarriers
};