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

  return async (ctx: Context, next: () => Promise<unknown>) => {
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

    if (!await exists()) {
      await store.set(ip, opt.windowMs, {
        remaining: opt.max,
        lastRequestTimestamp: timestamp,
      });
    }

    if (
      await exists() &&
      Date.now() - (await get())!.lastRequestTimestamp < opt.windowMs &&
      (await get())!.remaining === 0
    ) {
      await opt.onRateLimit(ctx, next, opt);
    } else {
      if (opt.headers) {
        ctx.response.headers.set(
          "X-RateLimit-Remaining",
          store.get(ip)
            ? (await get())!.remaining.toString()
            : opt.max.toString(),
        );
      }

      store.set(ip, opt.windowMs, {
        remaining: (await get())!.remaining - 1,
        lastRequestTimestamp: timestamp,
      });

      await next();

      // setTimeout(async () => {
      //   const exist = await exists();

      //   if (
      //     exist &&
      //     Date.now() - (await get())!.lastRequestTimestamp > opt.windowMs
      //   ) {
      //     await store.delete(ip);
      //   }
      // }, opt.windowMs);
    }
  };
};

export const onRateLimit = async (
  ctx: Context,
  _next: () => Promise<unknown>,
  opt: RateLimitOptions,
): Promise<unknown> => {
  await opt.store.set(ctx.request.ip, opt.windowMs, {
    remaining: 0,
    lastRequestTimestamp: Date.now(),
  });
  ctx.response.status = opt.statusCode;
  if (opt.headers) ctx.response.headers.set("X-RateLimit-Remaining", "0");
  return ctx.response.body = { error: opt.message };
};
