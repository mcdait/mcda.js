import { AbstractDecisionProblem } from "./abstract-decision-problem";
import { ConfigurableNormalizationInterface, NormalizationCallback } from "../types/core";

export abstract class AbstractNormalizedDecisionProblem
  extends AbstractDecisionProblem
  implements ConfigurableNormalizationInterface
{
  protected _normalizationCallback: NormalizationCallback | undefined;

  public get normalizationCallback(): NormalizationCallback | undefined {
    return this._normalizationCallback;
  }

  public set normalizationCallback(normalizationCallback: NormalizationCallback | undefined) {
    this._normalizationCallback = normalizationCallback;
  }
}
