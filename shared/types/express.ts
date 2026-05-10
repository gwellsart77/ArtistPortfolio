/**
 * Shared Express route type definitions for Phase 4 type safety
 * No behavior changes - pure type improvements
 */

import { Request, Response } from 'express';

// Generic Express route types for consistent typing
export type ExpressHandler<
  TParams = {},
  TResBody = any,
  TReqBody = any,
  TReqQuery = {}
> = (
  req: Request<TParams, TResBody, TReqBody, TReqQuery>,
  res: Response<TResBody>
) => Promise<Response<TResBody> | void> | Response<TResBody> | void;

// Common parameter patterns
export interface IdParams {
  id: string;
}

export interface KeyParams {
  key: string;
}

// Helper type for optional params
export type OptionalUndefined<T> = {
  [K in keyof T]: T[K] | undefined;
};