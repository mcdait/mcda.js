export type DebugBag = Record<string, unknown>;

export interface DebuggableInterface {
  get debugBag(): DebugBag | undefined;
  enableDebug(enableDebug: boolean): void;
  addToDebugBag(field: string, value: unknown): void;
}
