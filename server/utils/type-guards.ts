/**
 * Type Guards and Utility Functions
 * Enhanced type safety for the improved TypeScript configuration
 */

/**
 * Checks if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely handles database query results that might be undefined
 */
export function assertDefined<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Type-safe error handling for unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Safely converts null to undefined for optional fields
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Type-safe array filter that removes null and undefined values
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Safely parses JSON with type checking
 */
export function parseJSON<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Type-safe environment variable access
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

/**
 * Validates that a number is within a specific range
 */
export function isValidNumber(value: unknown, min?: number, max?: number): value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

/**
 * Type-safe object property access
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return prop in obj;
}