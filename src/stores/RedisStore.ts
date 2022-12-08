import {
  connect,
  Redis,
  RedisConnectOptions,
} from "https://deno.land/x/redis@v0.26.0/mod.ts";
import type { RateLimit } from "../types/types.d.ts";
import { Store } from "./AbstractStore.ts";

export class RedisStore extends Store {
  private store: Redis | undefined;
  private options: RedisConnectOptions;
  private initialized: boolean;

  constructor(options: RedisConnectOptions) {
    super();
    this.options = options;
    this.initialized = false;
  }

  public async init() {
    this.store = await connect({
      hostname: this.options.hostname,
      port: this.options.port,
      tls: this.options.tls,
      db: this.options.db,
      password: this.options.password,
      name: this.options.name,
      maxRetryCount: this.options.maxRetryCount,
    });

    this.initialized = true;
  }

  public async get(ip: string) {
    if (!this.isConnected) throw "[oak-rate-limit] RedisStore is not connected";
    const data = await this.store!.get(ip);
    if (!data) return;
    return JSON.parse(data);
  }

  public async set(ip: string, RateLimit: RateLimit) {
    if (!this.isConnected) throw "[oak-rate-limit] RedisStore is not connected";

    await this.store!
      .set(ip, JSON.stringify(RateLimit));

    return RateLimit;
  }

  public delete(ip: string) {
    if (!this.isConnected) throw "[oak-rate-limit] RedisStore is not connected";

    const value = Boolean((this.store!).del(ip));
    return value;
  }

  public async has(ip: string) {
    if (!this.isConnected) throw "[oak-rate-limit] RedisStore is not connected";

    return await this.store?.exists(ip)! > 0;
  }

  private get isConnected() {
    return Boolean(this.initialized && this.store && this.store.isConnected);
  }
}
