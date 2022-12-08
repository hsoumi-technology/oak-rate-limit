import { Context } from "../../deps.ts";
import { Store } from "../stores/AbstractStore.ts";

export interface RateLimit {
  remaining: number;
  lastRequestTimestamp: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  store: Store;
  headers: boolean;
  message: string;
  statusCode: number;
  skip: (ctx: Context) => Promise<boolean> | boolean;
  onRateLimit: (
    ctx: Context,
    next: () => Promise<unknown>,
    opt: RateLimitOptions,
  ) => unknown;
}
