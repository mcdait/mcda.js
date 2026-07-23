import type { DecisionMatrix, Scores } from "../../types";
import { AbstractNormalizedDecisionProblem } from "../../core";

export class MabacDecisionProblem extends AbstractNormalizedDecisionProblem {
  public override get scores(): Scores {
    this.validate();
    return this.mabac();
  }

  protected override validate(): void {
    super.validate();

    if (this.normalizationCallback === undefined) {
      throw new Error("This MABAC implementation requires a normalization callback.");
    }
  }

  private mabac(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("This MABAC implementation requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizationCallback(this.matrix, this.types);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const weightedNormalizedMatrix = this.getWeightedNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("weightedNormalizedMatrix", weightedNormalizedMatrix);

    const borderApproximationArea = this.getBorderApproximationArea(weightedNormalizedMatrix);
    this.addToDebugBag("borderApproximationArea", borderApproximationArea);

    const distanceMatrix = this.getDistanceMatrix(
      weightedNormalizedMatrix,
      borderApproximationArea,
    );
    this.addToDebugBag("distanceMatrix", distanceMatrix);

    return distanceMatrix.map((alternativeValues) =>
      alternativeValues.reduce((sum, value) => sum + value, 0),
    );
  }

  private getWeightedNormalizedMatrix(matrix: DecisionMatrix): DecisionMatrix {
    return matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => {
        const weight = this.weights[criterionIndex];

        if (weight === undefined) {
          throw new Error("MABAC criterion weight is required.");
        }

        return weight * (value + 1);
      }),
    );
  }

  private getBorderApproximationArea(matrix: DecisionMatrix): number[] {
    return this.weights.map((_, criterionIndex) => {
      const product = matrix.reduce((total, alternativeValues) => {
        const value = alternativeValues[criterionIndex];

        if (value === undefined) {
          throw new Error("MABAC weighted normalized value is required.");
        }

        return total * value;
      }, 1);

      return product ** (1 / matrix.length);
    });
  }

  private getDistanceMatrix(
    matrix: DecisionMatrix,
    borderApproximationArea: number[],
  ): DecisionMatrix {
    return matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => {
        const borderValue = borderApproximationArea[criterionIndex];

        if (borderValue === undefined) {
          throw new Error("MABAC border approximation value is required.");
        }

        return value - borderValue;
      }),
    );
  }
}
