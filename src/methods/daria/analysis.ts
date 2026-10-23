import { CriterionType } from "../../types";
import type { Scores, VariabilityCallback, ConfigurableVariabilityInterface } from "../../types";
import { AbstractMatrixAnalysis } from "../../core";
import { calculateDaria } from "./calculation";
import type { DariaResult } from "./types";
import { standardDeviationVariability } from "./variability-functions";

/** Analyze existing MCDA scores: periods in rows, alternatives in columns. */
export class DariaAnalysis
  extends AbstractMatrixAnalysis<DariaResult>
  implements ConfigurableVariabilityInterface
{
  protected _preferenceType = CriterionType.BENEFIT;
  protected _variabilityCallback: VariabilityCallback | undefined;

  public get preferenceType(): CriterionType {
    return this._preferenceType;
  }
  public set preferenceType(value: CriterionType) {
    this._preferenceType = value;
  }
  public get variabilityCallback(): VariabilityCallback | undefined {
    return this._variabilityCallback;
  }
  public set variabilityCallback(value: VariabilityCallback | undefined) {
    this._variabilityCallback = value;
  }
  public get scores(): Scores {
    return this.result.scores;
  }

  public get result(): DariaResult {
    const result = calculateDaria(
      this.matrix,
      this.variabilityCallback ?? standardDeviationVariability,
      this.preferenceType,
    );
    this.addToDebugBag("scores", result.scores);
    this.addToDebugBag("variability", result.variability);
    this.addToDebugBag("direction", result.direction);
    this.addToDebugBag("directionLabels", result.directionLabels);
    if (this._debugBag !== undefined) {
      this.addToDebugBag("latestScores", [...this.matrix[this.matrix.length - 1]]);
    }
    return result;
  }
}
