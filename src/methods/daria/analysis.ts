import { CriterionType } from "../../types";
import type { DebugBag, DecisionMatrix, Scores } from "../../types";
import { calculateDaria } from "./calculation";
import type { DariaResult, VariabilityCallback } from "./types";
import { standardDeviationVariability } from "./variability-functions";

/** Analyze existing MCDA scores: periods in rows, alternatives in columns. */
export class DariaAnalysis {
  protected _matrix: DecisionMatrix = [];
  protected _preferenceType = CriterionType.BENEFIT;
  protected _variabilityCallback: VariabilityCallback | undefined;
  protected _debugBag: DebugBag | undefined;

  public get matrix(): DecisionMatrix {
    return this._matrix;
  }
  public set matrix(value: DecisionMatrix) {
    this._matrix = value;
  }
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
  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }
  public enableDebug(enabled: boolean): void {
    this._debugBag = enabled ? {} : undefined;
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
    if (this._debugBag)
      Object.assign(this._debugBag, result, {
        latestScores: [...this.matrix[this.matrix.length - 1]],
      });
    return result;
  }
}
