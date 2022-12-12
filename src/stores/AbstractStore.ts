import type { RateLimit } from "../types/types.d.ts";

export abstract class Store {
  public init(): Promise<void> | void {
    throw "Not implemented";
  }

  public get(_ip: string): Promise<RateLimit> | RateLimit | undefined {
    throw "Not implemented";
  }

  public set(
    _ip: string,
    _windowMs: number,
    _RateLimit: RateLimit,
  ): Promise<RateLimit> | Map<string, RateLimit> {
    throw "Not implemented";
  }

  public delete(_ip: string): Promise<boolean> | boolean {
    throw "Not implemented";
  }

  public has(_ip: string): Promise<boolean> | boolean {
    throw "Not implemented";
  }
}
