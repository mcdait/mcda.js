import type { DebugBag, DebuggableInterface } from "../types";

/** Shared diagnostic storage; enabling debug starts a fresh bag. */
export abstract class AbstractDebuggable implements DebuggableInterface {
  protected _debugBag: DebugBag | undefined;

  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }

  public enableDebug(enableDebug: boolean): void {
    this._debugBag = enableDebug ? {} : undefined;
  }

  public addToDebugBag(field: string, value: unknown): void {
    const debugBag = this.debugBag;
    if (debugBag !== undefined) {
      debugBag[field] = value;
    }
  }
}
