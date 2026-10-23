import { AbstractDebuggable } from "./abstract-debuggable";
import type {
  AlternativesInputInterface,
  CriteriaInputInterface,
  WeightsInputInterface,
  Scores,
} from "../types";

/** Shared state and diagnostics, independent of the decision matrix format. */
export abstract class AbstractBaseDecisionProblem
  extends AbstractDebuggable
  implements AlternativesInputInterface, CriteriaInputInterface, WeightsInputInterface
{
  protected _weights: number[] = [];
  protected _alternatives: string[] = [];
  protected _criteria: string[] = [];

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
}
