import axios from 'axios';
import { storage } from './storage';

// Interface for the address
interface AddressData {
  address: string;
}

// Constants for zone determination
const DENVER_COORDINATES = {
  latitude: 39.7392,
  longitude: -104.9903
};

// US State abbreviations to help with region determination
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

// Country codes for international zones
const INTERNATIONAL_ZONE_1 = ['CA', 'MX']; // Canada and Mexico
const INTERNATIONAL_ZONE_2 = 'Rest of World'; // All other countries

/**
 * Calculate the distance between two points in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  
  const earthRadiusMiles = 3958.8; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = earthRadiusMiles * c;
  
  return distance;
}

/**
 * Simple address parsing to extract country and state
 */
function parseAddress(address: string): { country: string, state: string | null } {
  const addressUpper = address.toUpperCase();
  
  // Check for US states
  let detectedState = null;
  for (const state of US_STATES) {
    // Check for state abbreviation with space before and non-letter after (or end of string)
    if (addressUpper.match(new RegExp(`\\s${state}\\b`))) {
      detectedState = state;
      break;
    }
  }
  
  // Simple country detection
  let country = 'US'; // Default to US
  if (addressUpper.includes('CANADA') || addressUpper.match(/\bCA\b/) && !addressUpper.match(/\bCA\s*\d{5}/)) {
    country = 'CA';
  } else if (addressUpper.includes('MEXICO') || addressUpper.includes('MÉXICO')) {
    country = 'MX';
  } else if (!detectedState && !addressUpper.match(/\b(USA|U\.S\.A\.|UNITED STATES)\b/) && !addressUpper.match(/\d{5}(-\d{4})?/)) {
    // If no US state is found and no US zip code pattern, and no explicit US mention, assume international
    country = 'OTHER';
  }
  
  return { country, state: detectedState };
}

/**
 * Determine shipping zone ID based on address
 */
export async function determineShippingZone(addressData: AddressData): Promise<number> {
  try {
    const { address } = addressData;
    const { country, state } = parseAddress(address);
    
    // Get all shipping zones
    const shippingZones = await storage.getAllShippingZones();
    
    // Default to Zone 3 (National) as fallback
    let zoneId = 3;
    
    if (country === 'US') {
      // Denver's state is Colorado (CO)
      if (state === 'CO') {
        // For addresses in Colorado, we'll assume Zone 1 (Local)
        // This is a simplification - for a more accurate approach, 
        // we'd need to use geocoding to get the exact distance
        zoneId = 1;
      } else {
        // Check if it's a neighboring state (which we'll consider Zone 2)
        const neighboringStates = ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'];
        if (neighboringStates.includes(state || '')) {
          zoneId = 2; // Regional
        } else {
          zoneId = 3; // National
        }
      }
    } else if (INTERNATIONAL_ZONE_1.includes(country)) {
      // Canada or Mexico
      zoneId = 4; // International Zone 1
    } else {
      // Rest of the world
      zoneId = 5; // International Zone 2
    }
    
    // Find the zone by ID
    const foundZone = shippingZones.find(zone => zone.id === zoneId);
    
    // If the zone exists and is active, return it
    if (foundZone && foundZone.active) {
      return foundZone.id;
    } else {
      // Fallback to national shipping if the zone isn't found or active
      return 3;
    }
  } catch (error) {
    console.error('Error determining shipping zone:', error);
    // Default to Zone 3 (National) in case of error
    return 3;
  }
}