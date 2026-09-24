import type {
  AlternativesInputInterface,
  CriteriaInputInterface,
  WeightsInputInterface,
  DebuggableInterface,
  DebugBag,
  Scores,
} from "../types";

/** Shared state and diagnostics, independent of the decision matrix format. */
export abstract class AbstractBaseDecisionProblem
  implements
    AlternativesInputInterface,
    CriteriaInputInterface,
    WeightsInputInterface,
    DebuggableInterface
{
  protected _weights: number[] = [];
  protected _alternatives: string[] = [];
  protected _criteria: string[] = [];
  protected _debugBag: DebugBag | undefined;

  public get alternatives(): string[] {
    return this._alternatives;
  }

  public set alternatives(alternatives: string[]) {
    this._alternatives = alternatives;
  }

  public get criteria(): string[] {
    return this._criteria;
  }

  public set criteria(criteria: string[]) {
    this._criteria = criteria;
  }

  public get weights(): number[] {
    return this._weights;
  }

  public set weights(weights: number[]) {
    this._weights = weights;
  }

  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }

  public enableDebug(enableDebug: boolean): void {
    this._debugBag = enableDebug ? {} : undefined;
  }

  public abstract get scores(): Scores;

  protected abstract validate(): void;

  protected validateOptionalNames(names: string[], expectedCount: number, fieldName: string): void {
    if (names.length === 0) {
      return;
    }

    if (names.length !== expectedCount) {
      throw new Error(
        `Decision problem requires one ${fieldName} name per ${fieldName} when ${fieldName} names are provided.`,
      );
    }

    for (const name of names) {
      if (name.trim().length === 0) {
        throw new Error(`Decision problem ${fieldName} names cannot be empty.`);
      }
    }
  }

  public addToDebugBag(field: string, value: unknown): void {
    const debugBag = this.debugBag;

    if (debugBag !== undefined) {
      debugBag[field] = value;
    }
  }
}
