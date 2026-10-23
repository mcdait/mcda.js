import { AbstractDecisionProblem } from "./abstract-decision-problem";
import type {
  ConfigurableNormalizationInterface,
  DecisionMatrix,
  NormalizationCallback,
} from "../types/core";

export abstract class AbstractNormalizedDecisionProblem
  extends AbstractDecisionProblem
  implements ConfigurableNormalizationInterface
{
  protected _normalizationCallback: NormalizationCallback | undefined;

  // Callbacks previously received live references and could mutate the problem's
  // matrix or criterion types, affecting subsequent score calculations. Pass copies
  // so callbacks can modify their inputs without changing the stored problem data.
  protected normalizeMatrix(callback: NormalizationCallback): DecisionMatrix {
    return callback(
      this.matrix.map((row) => [...row]),
      [...this.types],
    );
  }

  public get normalizationCallback(): NormalizationCallback | undefined {
    return this._normalizationCallback;
  }

  public set normalizationCallback(normalizationCallback: NormalizationCallback | undefined) {
    this._normalizationCallback = normalizationCallback;
  }
}
