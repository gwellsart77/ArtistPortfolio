// HTTP Types for Express Route Handlers
// Phase 3: Type Safety Cleanup

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// Common Express route parameter types
export interface IdParams {
  id: string;
}

export interface KeyParams {
  key: string;
}

// Stripe webhook types
export interface StripeWebhookBody {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
}

// API configuration types
export interface ApiConfigRequest {
  key: string;
  value: string;
  service?: string;
  description?: string;
}

// Health check types
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
  uptime?: number;
}

export interface ReadinessResponse extends HealthResponse {
  checks: {
    database: 'ok' | 'error';
  };
}