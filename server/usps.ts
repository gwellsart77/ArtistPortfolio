import axios from 'axios';

const USPS_BASE_URL = 'https://api.usps.com';

// USPS API client setup
class USPSClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private consumerKey: string,
    private consumerSecret: string
  ) {}

  // Get OAuth access token
  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${USPS_BASE_URL}/oauth2/v3/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, set expiry 5 minutes before actual expiry
      const expiresIn = response.data.expires_in - 300;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting USPS access token:', error);
      throw new Error('Failed to authenticate with USPS API');
    }
  }

  // Get shipping rates for artwork
  async getShippingRates(params: {
    fromZip: string;
    toZip: string;
    weight: number; // in ounces
    length: number; // in inches
    width: number;
    height: number;
    value: number; // for insurance
  }): Promise<USPSShippingRate[]> {
    try {
      const token = await this.getAccessToken();

      const requestBody = {
        originZIPCode: params.fromZip,
        destinationZIPCode: params.toZip,
        weight: params.weight,
        length: params.length,
        width: params.width,
        height: params.height,
        mailClass: "USPS_GROUND_ADVANTAGE", // Good for artwork
        priceType: "RETAIL",
        accountType: "EPS",
        accountNumber: "",
        itemValue: params.value,
        extraServices: [
          141, // Insurance
          155  // Signature Confirmation
        ]
      };

      const response = await axios.post(
        `${USPS_BASE_URL}/prices/v3/base-rates/search`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Transform USPS response to our format
      const rates: USPSShippingRate[] = [];
      
      if (response.data.rateOptions) {
        for (const option of response.data.rateOptions) {
          rates.push({
            service: option.description || 'USPS Ground Advantage',
            cost: parseFloat(option.totalBasePrice) || 0,
            deliveryDays: option.deliveryDays || '3-5',
            mailClass: option.mailClass,
            extraServices: option.extraServices || []
          });
        }
      }

      // Add Priority Mail and Priority Mail Express options
      await this.addPriorityMailRates(params, rates, token);

      return rates;
    } catch (error) {
      console.error('Error getting USPS shipping rates:', error);
      throw new Error('Failed to get shipping rates from USPS');
    }
  }

  // Get Priority Mail rates separately
  private async addPriorityMailRates(
    params: any, 
    rates: USPSShippingRate[], 
    token: string
  ): Promise<void> {
    try {
      // Priority Mail
      const priorityRequest = {
        ...params,
        mailClass: "PRIORITY_MAIL"
      };

      const priorityResponse = await axios.post(
        `${USPS_BASE_URL}/prices/v3/base-rates/search`,
        priorityRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (priorityResponse.data.rateOptions) {
        for (const option of priorityResponse.data.rateOptions) {
          rates.push({
            service: 'Priority Mail',
            cost: parseFloat(option.totalBasePrice) || 0,
            deliveryDays: '1-3',
            mailClass: 'PRIORITY_MAIL',
            extraServices: option.extraServices || []
          });
        }
      }

      // Priority Mail Express
      const expressRequest = {
        ...params,
        mailClass: "PRIORITY_MAIL_EXPRESS"
      };

      const expressResponse = await axios.post(
        `${USPS_BASE_URL}/prices/v3/base-rates/search`,
        expressRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (expressResponse.data.rateOptions) {
        for (const option of expressResponse.data.rateOptions) {
          rates.push({
            service: 'Priority Mail Express',
            cost: parseFloat(option.totalBasePrice) || 0,
            deliveryDays: '1-2',
            mailClass: 'PRIORITY_MAIL_EXPRESS',
            extraServices: option.extraServices || []
          });
        }
      }
    } catch (error) {
      console.log('Could not get Priority Mail rates:', error.message);
    }
  }

  // Validate address using USPS API
  async validateAddress(address: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<{
    isValid: boolean;
    correctedAddress?: any;
    suggestions?: any[];
  }> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${USPS_BASE_URL}/addresses/v3/address`,
        {
          streetAddress: address.streetAddress,
          city: address.city,
          state: address.state,
          ZIPCode: address.zipCode
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        isValid: true,
        correctedAddress: response.data
      };
    } catch (error) {
      console.error('Error validating address:', error);
      return {
        isValid: false,
        suggestions: []
      };
    }
  }
}

// Types for USPS integration
export interface USPSShippingRate {
  service: string;
  cost: number;
  deliveryDays: string;
  mailClass: string;
  extraServices: any[];
}

export interface ShippingCalculation {
  fromZip: string;
  toZip: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
}

// Initialize USPS client
if (!process.env.USPS_CONSUMER_KEY || !process.env.USPS_CONSUMER_SECRET) {
  throw new Error('USPS API credentials not found in environment variables');
}

export const uspsClient = new USPSClient(
  process.env.USPS_CONSUMER_KEY,
  process.env.USPS_CONSUMER_SECRET
);

// Helper function to estimate artwork shipping weight and dimensions
export function estimateArtworkShipping(artwork: {
  dimensions?: string;
  width?: number;
  height?: number;
  type: string;
}): {
  weight: number; // in ounces
  length: number; // in inches
  width: number;
  height: number;
} {
  let length = 24; // default
  let width = 18;
  let height = 2;
  let weight = 32; // 2 lbs default for framed artwork

  // Parse dimensions if available
  if (artwork.dimensions) {
    const dimensionMatch = artwork.dimensions.match(/(\d+)["']?\s*[x×]\s*(\d+)["']?/);
    if (dimensionMatch) {
      width = parseInt(dimensionMatch[1]);
      length = parseInt(dimensionMatch[2]);
    }
  } else if (artwork.width && artwork.height) {
    width = artwork.width;
    length = artwork.height;
  }

  // Adjust weight based on artwork type and size
  const area = length * width;
  
  if (artwork.type === 'canvas') {
    weight = Math.max(16, area * 0.1); // Minimum 1 lb for canvas
    height = 3; // Canvas depth
  } else if (artwork.type === 'print') {
    weight = Math.max(8, area * 0.05); // Prints are lighter
    height = 1; // Print thickness
  } else {
    // Original paintings - heavier due to frame
    weight = Math.max(48, area * 0.2); // Minimum 3 lbs for original
    height = 4; // Frame depth
  }

  // Add packaging weight (2-4 oz)
  weight += 4;

  return {
    weight: Math.round(weight),
    length: Math.round(length + 4), // Add packaging
    width: Math.round(width + 4),
    height: Math.round(height + 2)
  };
}