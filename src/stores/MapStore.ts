import type { RateLimit } from "../types/types.d.ts";
import { Store } from "./AbstractStore.ts";

export class MapStore extends Store {
  private readonly store: Map<string, RateLimit>;

  constructor() {
    super();
    this.store = new Map<string, RateLimit>();
  }

  public init() {
    return;
  }

  public get(ip: string) {
    return this.store.get(ip);
  }

  public set(ip: string, RateLimit: RateLimit) {
    return this.store.set(ip, RateLimit);
  }

  public delete(ip: string) {
    return this.store.delete(ip);
  }

  public has(ip: string) {
    return this.store.has(ip);
  }
}
