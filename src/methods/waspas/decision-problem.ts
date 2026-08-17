import { AbstractNormalizedDecisionProblem } from "../../core";
import type { DecisionMatrix, Scores } from "../../types";

export class WaspasDecisionProblem extends AbstractNormalizedDecisionProblem {
  /**
   * Balances the weighted sum and weighted product models. A value of 1 uses
   * only the weighted sum, 0 uses only the weighted product, and the default
   * value of 0.5 gives both models equal influence.
   */
  protected _lambda = 0.5;

  public get lambda(): number {
    return this._lambda;
  }

  public set lambda(lambda: number) {
    this._lambda = lambda;
  }

  public override get scores(): Scores {
    this.validate();
    return this.waspas();
  }

  protected override validate(): void {
    super.validate();

    if (this.normalizationCallback === undefined) {
      throw new Error("This WASPAS implementation requires a normalization callback.");
    }

    if (!Number.isFinite(this.lambda) || this.lambda < 0 || this.lambda > 1) {
      throw new Error("WASPAS parameter lambda must be between 0 and 1.");
    }
  }

  private waspas(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("This WASPAS implementation requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizationCallback(this.matrix, this.types);
    this.validateNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const weightedSumScores = this.getWeightedSumScores(normalizedMatrix);
    this.addToDebugBag("weightedSumScores", weightedSumScores);

    const weightedProductScores = this.getWeightedProductScores(normalizedMatrix);
    this.addToDebugBag("weightedProductScores", weightedProductScores);

    const appraisalScores = weightedSumScores.map(
      (weightedSumScore, alternativeIndex) =>
        this.lambda * weightedSumScore +
        (1 - this.lambda) * (weightedProductScores[alternativeIndex] ?? 0),
    );
    this.addToDebugBag("appraisalScores", appraisalScores);

    return appraisalScores;
  }

  private validateNormalizedMatrix(matrix: DecisionMatrix): void {
    if (matrix.length !== this.matrix.length) {
      throw new Error("WASPAS normalized matrix must contain one row per alternative.");
    }

    for (const alternativeValues of matrix) {
      if (alternativeValues.length !== this.weights.length) {
        throw new Error("WASPAS normalized matrix rows must match the weights length.");
      }

      if (alternativeValues.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new Error("WASPAS normalized matrix values must be non-negative and finite.");
      }
    }
  }

  private getWeightedSumScores(matrix: DecisionMatrix): number[] {
    return matrix.map((alternativeValues) =>
      alternativeValues.reduce(
        (sum, value, criterionIndex) => sum + value * (this.weights[criterionIndex] ?? 0),
        0,
      ),
    );
  }

  private getWeightedProductScores(matrix: DecisionMatrix): number[] {
    return matrix.map((alternativeValues) =>
      alternativeValues.reduce(
        (product, value, criterionIndex) => product * value ** (this.weights[criterionIndex] ?? 0),
        1,
      ),
    );
  }
}
