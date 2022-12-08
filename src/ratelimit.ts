import { Context, Middleware } from "../deps.ts";
import type { RateLimitOptions } from "./types/types.d.ts";
import { DefaultOptions } from "./utils/defaults.ts";

export const RateLimiter = async (
  options?: Partial<RateLimitOptions>,
): Promise<Middleware> => {
  const opt: RateLimitOptions = { ...DefaultOptions, ...options };

  await opt.store.init();

  if (typeof opt.onRateLimit !== "function") {
    throw "onRateLimit must be a function.";
  }

  if (typeof opt.skip !== "function") {
    throw "skip must be a function.";
  }

  return async (ctx: Context, next) => {
    const { ip } = ctx.request;
    const timestamp = Date.now();

    // if skip return true, we don't check rate limit
    if (await opt.skip(ctx)) return next();

    if (opt.headers) {
      ctx.response.headers.set("X-RateLimit-Limit", opt.max.toString());
    }

    const store = opt.store;
    const exists = async () => await store.has(ip);
    const get = async () => await store.get(ip);

    // we check if the current ip exists
    // and its last request is older than the window allowed
    // so we delete it.
    // ! This is not very good for bigger scale,
    // ! we should add something like timeout
    // ! that will remove the entry after the given window
    // ? create a setTimeout(fn,windowMs) that will clean the entry
    if (
      await exists() &&
      timestamp - (await get())!.lastRequestTimestamp >
        opt.windowMs
    ) {
      await store.delete(ip);
    }

    if (!await exists()) {
      await store.set(ip, {
        remaining: opt.max,
        lastRequestTimestamp: timestamp,
      });
    }

    if (await exists() && (await get())!.remaining === 0) {
      await opt.onRateLimit(ctx, next, opt);
    } else {
      await next();
      if (opt.headers) {
        ctx.response.headers.set(
          "X-RateLimit-Remaining",
          store.get(ip)
            ? (await get())!.remaining.toString()
            : opt.max.toString(),
        );
      }

      store.set(ip, {
        remaining: (await get())!.remaining - 1,
        lastRequestTimestamp: timestamp,
      });
    }
  };
};

export const onRateLimit = async (
  ctx: Context,
  _next: () => Promise<unknown>,
  opt: RateLimitOptions,
): Promise<unknown> => {
  await opt.store.set(ctx.request.ip, {
    remaining: 0,
    lastRequestTimestamp: Date.now(),
  });
  ctx.response.status = opt.statusCode;
  if (opt.headers) ctx.response.headers.set("X-RateLimit-Remaining", "0");
  return ctx.response.body = { error: opt.message };
};
