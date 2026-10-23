import { AbstractNormalizedDecisionProblem } from "../../core";
import type { DecisionMatrix, Scores } from "../../types";
import { validateWeights } from "../shared/numeric";

export class SawDecisionProblem extends AbstractNormalizedDecisionProblem {
  public override get scores(): Scores {
    this.validate();
    return this.saw();
  }

  protected override validate(): void {
    super.validate();
    validateWeights(this.weights, this.weights.length);

    if (this.normalizationCallback === undefined) {
      throw new Error("This SAW implementation requires a normalization callback.");
    }
  }

  private saw(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("This SAW implementation requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizeMatrix(this.normalizationCallback);
    this.validateNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const weightedNormalizedMatrix = this.getWeightedNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("weightedNormalizedMatrix", weightedNormalizedMatrix);

    const preferenceScores = weightedNormalizedMatrix.map((alternativeValues) =>
      alternativeValues.reduce((sum, value) => sum + value, 0),
    );
    this.addToDebugBag("preferenceScores", preferenceScores);

    return preferenceScores;
  }

  private validateNormalizedMatrix(matrix: DecisionMatrix): void {
    if (matrix.length !== this.matrix.length) {
      throw new Error("SAW normalized matrix must contain one row per alternative.");
    }

    for (const alternativeValues of matrix) {
      if (alternativeValues.length !== this.weights.length) {
        throw new Error("SAW normalized matrix rows must match the weights length.");
      }

      if (alternativeValues.some((value) => !Number.isFinite(value))) {
        throw new Error("SAW normalized matrix values must be finite.");
      }
    }
  }

  private getWeightedNormalizedMatrix(matrix: DecisionMatrix): DecisionMatrix {
    return matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => value * (this.weights[criterionIndex] ?? 0)),
    );
  }
}
