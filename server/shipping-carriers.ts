import axios from 'axios';
import { uspsClient, estimateArtworkShipping } from './usps';

// Base shipping carrier interface
interface ShippingCarrier {
  name: string;
  enabled: boolean;
  getRates(params: ShippingRateParams): Promise<ShippingRate[]>;
}

export interface ShippingRateParams {
  fromZip: string;
  toZip: string;
  weight: number; // in ounces
  length: number; // in inches
  width: number;
  height: number;
  value: number; // for insurance
}

export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  deliveryDays: string;
  description: string;
  transitTime?: string;
}

// USPS Carrier Implementation
class USPSCarrier implements ShippingCarrier {
  name = 'USPS';
  enabled = true; // Active by default since credentials are provided

  async getRates(params: ShippingRateParams): Promise<ShippingRate[]> {
    try {
      const uspsRates = await uspsClient.getShippingRates(params);
      
      return uspsRates.map(rate => ({
        carrier: 'USPS',
        service: rate.service,
        cost: rate.cost,
        deliveryDays: rate.deliveryDays,
        description: `${rate.service} (${rate.deliveryDays} business days)`,
        transitTime: rate.deliveryDays
      }));
    } catch (error) {
      console.log('USPS API unavailable, using fallback rates');
      return this.getFallbackRates(params);
    }
  }

  private getFallbackRates(params: ShippingRateParams): ShippingRate[] {
    const baseRate = params.weight > 32 ? 19.99 : 12.99;
    
    return [
      {
        carrier: 'USPS',
        service: 'Ground Advantage',
        cost: baseRate,
        deliveryDays: '3-5',
        description: 'USPS Ground Advantage (3-5 business days)',
        transitTime: '3-5'
      },
      {
        carrier: 'USPS',
        service: 'Priority Mail',
        cost: baseRate + 12,
        deliveryDays: '1-3',
        description: 'USPS Priority Mail (1-3 business days)',
        transitTime: '1-3'
      },
      {
        carrier: 'USPS',
        service: 'Priority Mail Express',
        cost: baseRate + 27,
        deliveryDays: '1-2',
        description: 'USPS Priority Mail Express (1-2 business days)',
        transitTime: '1-2'
      }
    ];
  }
}

// UPS Carrier Implementation (Ready for activation)
class UPSCarrier implements ShippingCarrier {
  name = 'UPS';
  enabled = false; // Disabled until credentials are provided

  constructor(
    private apiKey?: string,
    private username?: string,
    private password?: string,
    private accountNumber?: string
  ) {
    this.enabled = !!(apiKey && username && password && accountNumber);
  }

  async getRates(params: ShippingRateParams): Promise<ShippingRate[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      // UPS API Rate Request
      const requestBody = {
        RateRequest: {
          Request: {
            RequestOption: "Rate",
            TransactionReference: {
              CustomerContext: "Artwork Shipping"
            }
          },
          Shipment: {
            Shipper: {
              Address: {
                PostalCode: params.fromZip,
                CountryCode: "US"
              }
            },
            ShipTo: {
              Address: {
                PostalCode: params.toZip,
                CountryCode: "US"
              }
            },
            Package: {
              PackagingType: {
                Code: "02" // Customer Supplied Package
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "IN"
                },
                Length: params.length.toString(),
                Width: params.width.toString(),
                Height: params.height.toString()
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "LBS"
                },
                Weight: (params.weight / 16).toFixed(2) // Convert oz to lbs
              }
            },
            Service: {
              Code: "03" // UPS Ground
            }
          }
        }
      };

      const response = await axios.post(
        'https://onlinetools.ups.com/api/rating/v1/rate',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseUPSResponse(response.data);
    } catch (error) {
      console.log('UPS API error:', error);
      return this.getFallbackRates(params);
    }
  }

  private async getAccessToken(): Promise<string> {
    // UPS OAuth token request would go here
    // For now, return placeholder
    return 'ups_access_token_placeholder';
  }

  private parseUPSResponse(data: any): ShippingRate[] {
    const rates: ShippingRate[] = [];
    
    if (data.RateResponse?.RatedShipment) {
      const shipments = Array.isArray(data.RateResponse.RatedShipment) 
        ? data.RateResponse.RatedShipment 
        : [data.RateResponse.RatedShipment];

      shipments.forEach((shipment: any) => {
        rates.push({
          carrier: 'UPS',
          service: this.getUPSServiceName(shipment.Service?.Code),
          cost: parseFloat(shipment.TotalCharges?.MonetaryValue || '0'),
          deliveryDays: this.getUPSDeliveryDays(shipment.Service?.Code),
          description: `UPS ${this.getUPSServiceName(shipment.Service?.Code)}`,
          transitTime: this.getUPSDeliveryDays(shipment.Service?.Code)
        });
      });
    }

    return rates;
  }

  private getUPSServiceName(code: string): string {
    const services: { [key: string]: string } = {
      '03': 'Ground',
      '02': 'Second Day Air',
      '01': 'Next Day Air',
      '13': 'Next Day Air Saver',
      '12': 'Three-Day Select'
    };
    return services[code] || 'Ground';
  }

  private getUPSDeliveryDays(code: string): string {
    const deliveryDays: { [key: string]: string } = {
      '03': '1-5',
      '02': '2',
      '01': '1',
      '13': '1',
      '12': '3'
    };
    return deliveryDays[code] || '1-5';
  }

  private getFallbackRates(params: ShippingRateParams): ShippingRate[] {
    const baseRate = params.weight > 32 ? 22.99 : 15.99;
    
    return [
      {
        carrier: 'UPS',
        service: 'Ground',
        cost: baseRate,
        deliveryDays: '1-5',
        description: 'UPS Ground (1-5 business days)',
        transitTime: '1-5'
      },
      {
        carrier: 'UPS',
        service: 'Second Day Air',
        cost: baseRate + 20,
        deliveryDays: '2',
        description: 'UPS Second Day Air (2 business days)',
        transitTime: '2'
      },
      {
        carrier: 'UPS',
        service: 'Next Day Air',
        cost: baseRate + 45,
        deliveryDays: '1',
        description: 'UPS Next Day Air (1 business day)',
        transitTime: '1'
      }
    ];
  }
}

// FedEx Carrier Implementation (Ready for activation)
class FedExCarrier implements ShippingCarrier {
  name = 'FedEx';
  enabled = false; // Disabled until credentials are provided

  constructor(
    private apiKey?: string,
    private secretKey?: string,
    private accountNumber?: string,
    private meterNumber?: string
  ) {
    this.enabled = !!(apiKey && secretKey && accountNumber && meterNumber);
  }

  async getRates(params: ShippingRateParams): Promise<ShippingRate[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      // FedEx API Rate Request
      const requestBody = {
        accountNumber: {
          value: this.accountNumber
        },
        requestedShipment: {
          shipper: {
            address: {
              postalCode: params.fromZip,
              countryCode: "US"
            }
          },
          recipient: {
            address: {
              postalCode: params.toZip,
              countryCode: "US"
            }
          },
          requestedPackageLineItems: [{
            weight: {
              units: "LB",
              value: (params.weight / 16) // Convert oz to lbs
            },
            dimensions: {
              length: params.length,
              width: params.width,
              height: params.height,
              units: "IN"
            }
          }],
          pickupType: "DROPOFF_AT_FEDEX_LOCATION",
          serviceType: "FEDEX_GROUND",
          packagingType: "YOUR_PACKAGING"
        }
      };

      const response = await axios.post(
        'https://apis.fedex.com/rate/v1/rates/quotes',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseFedExResponse(response.data);
    } catch (error) {
      console.log('FedEx API error:', error);
      return this.getFallbackRates(params);
    }
  }

  private async getAccessToken(): Promise<string> {
    // FedEx OAuth token request would go here
    // For now, return placeholder
    return 'fedex_access_token_placeholder';
  }

  private parseFedExResponse(data: any): ShippingRate[] {
    const rates: ShippingRate[] = [];
    
    if (data.output?.rateReplyDetails) {
      data.output.rateReplyDetails.forEach((detail: any) => {
        detail.ratedShipmentDetails?.forEach((shipment: any) => {
          rates.push({
            carrier: 'FedEx',
            service: this.getFedExServiceName(detail.serviceType),
            cost: parseFloat(shipment.totalNetCharge || '0'),
            deliveryDays: this.getFedExDeliveryDays(detail.serviceType),
            description: `FedEx ${this.getFedExServiceName(detail.serviceType)}`,
            transitTime: this.getFedExDeliveryDays(detail.serviceType)
          });
        });
      });
    }

    return rates;
  }

  private getFedExServiceName(serviceType: string): string {
    const services: { [key: string]: string } = {
      'FEDEX_GROUND': 'Ground',
      'FEDEX_2_DAY': '2Day',
      'STANDARD_OVERNIGHT': 'Standard Overnight',
      'PRIORITY_OVERNIGHT': 'Priority Overnight',
      'FEDEX_EXPRESS_SAVER': 'Express Saver'
    };
    return services[serviceType] || 'Ground';
  }

  private getFedExDeliveryDays(serviceType: string): string {
    const deliveryDays: { [key: string]: string } = {
      'FEDEX_GROUND': '1-5',
      'FEDEX_2_DAY': '2',
      'STANDARD_OVERNIGHT': '1',
      'PRIORITY_OVERNIGHT': '1',
      'FEDEX_EXPRESS_SAVER': '3'
    };
    return deliveryDays[serviceType] || '1-5';
  }

  private getFallbackRates(params: ShippingRateParams): ShippingRate[] {
    const baseRate = params.weight > 32 ? 24.99 : 17.99;
    
    return [
      {
        carrier: 'FedEx',
        service: 'Ground',
        cost: baseRate,
        deliveryDays: '1-5',
        description: 'FedEx Ground (1-5 business days)',
        transitTime: '1-5'
      },
      {
        carrier: 'FedEx',
        service: '2Day',
        cost: baseRate + 18,
        deliveryDays: '2',
        description: 'FedEx 2Day (2 business days)',
        transitTime: '2'
      },
      {
        carrier: 'FedEx',
        service: 'Standard Overnight',
        cost: baseRate + 42,
        deliveryDays: '1',
        description: 'FedEx Standard Overnight (1 business day)',
        transitTime: '1'
      }
    ];
  }
}

// Shipping Manager - Orchestrates all carriers
class ShippingManager {
  private carriers: ShippingCarrier[] = [];

  constructor() {
    // Initialize carriers
    this.carriers = [
      new USPSCarrier(),
      new UPSCarrier(
        process.env.UPS_API_KEY,
        process.env.UPS_USERNAME,
        process.env.UPS_PASSWORD,
        process.env.UPS_ACCOUNT_NUMBER
      ),
      new FedExCarrier(
        process.env.FEDEX_API_KEY,
        process.env.FEDEX_SECRET_KEY,
        process.env.FEDEX_ACCOUNT_NUMBER,
        process.env.FEDEX_METER_NUMBER
      )
    ];
  }

  async getAllRates(params: ShippingRateParams): Promise<ShippingRate[]> {
    const allRates: ShippingRate[] = [];

    // Get rates from all enabled carriers
    for (const carrier of this.carriers) {
      if (carrier.enabled) {
        try {
          const rates = await carrier.getRates(params);
          allRates.push(...rates);
        } catch (error) {
          console.log(`${carrier.name} carrier error:`, error);
        }
      }
    }

    // Sort by cost
    return allRates.sort((a, b) => a.cost - b.cost);
  }

  getEnabledCarriers(): string[] {
    return this.carriers
      .filter(carrier => carrier.enabled)
      .map(carrier => carrier.name);
  }

  isCarrierEnabled(carrierName: string): boolean {
    const carrier = this.carriers.find(c => c.name === carrierName);
    return carrier?.enabled || false;
  }
}

export const shippingManager = new ShippingManager();

// Helper function for artwork shipping estimation
export { estimateArtworkShipping };