import { AbstractNormalizedDecisionProblem } from "../../core";
import type { DecisionMatrix, Scores } from "../../types";

export class CodasDecisionProblem extends AbstractNormalizedDecisionProblem {
  /**
   * The CODAS comparison threshold used to decide whether taxicab distance
   * should complement Euclidean distance. Taxicab distance is included when
   * the absolute difference between two Euclidean distances is at least tau.
   */
  protected _tau = 0.02;

  public get tau(): number {
    return this._tau;
  }

  public set tau(tau: number) {
    this._tau = tau;
  }

  public override get scores(): Scores {
    this.validate();
    return this.codas();
  }

  protected override validate(): void {
    super.validate();

    if (this.normalizationCallback === undefined) {
      throw new Error("This CODAS implementation requires a normalization callback.");
    }

    if (!Number.isFinite(this.tau) || this.tau < 0) {
      throw new Error("CODAS threshold tau must be a non-negative finite number.");
    }
  }

  private codas(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("This CODAS implementation requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizationCallback(this.matrix, this.types);
    this.validateNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const weightedNormalizedMatrix = this.getWeightedNormalizedMatrix(normalizedMatrix);
    this.addToDebugBag("weightedNormalizedMatrix", weightedNormalizedMatrix);

    const negativeIdealSolution = this.getNegativeIdealSolution(weightedNormalizedMatrix);
    this.addToDebugBag("negativeIdealSolution", negativeIdealSolution);

    const euclideanDistances = this.getEuclideanDistances(
      weightedNormalizedMatrix,
      negativeIdealSolution,
    );
    this.addToDebugBag("euclideanDistances", euclideanDistances);

    const taxicabDistances = this.getTaxicabDistances(
      weightedNormalizedMatrix,
      negativeIdealSolution,
    );
    this.addToDebugBag("taxicabDistances", taxicabDistances);

    const relativeAssessmentMatrix = this.getRelativeAssessmentMatrix(
      euclideanDistances,
      taxicabDistances,
    );
    this.addToDebugBag("relativeAssessmentMatrix", relativeAssessmentMatrix);

    const assessmentScores = relativeAssessmentMatrix.map((comparisons) =>
      comparisons.reduce((sum, comparison) => sum + comparison, 0),
    );
    this.addToDebugBag("assessmentScores", assessmentScores);

    return assessmentScores;
  }

  private validateNormalizedMatrix(matrix: DecisionMatrix): void {
    if (matrix.length !== this.matrix.length) {
      throw new Error("CODAS normalized matrix must contain one row per alternative.");
    }

    for (const alternativeValues of matrix) {
      if (alternativeValues.length !== this.weights.length) {
        throw new Error("CODAS normalized matrix rows must match the weights length.");
      }
    }
  }

  private getWeightedNormalizedMatrix(matrix: DecisionMatrix): DecisionMatrix {
    return matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => value * (this.weights[criterionIndex] ?? 0)),
    );
  }

  private getNegativeIdealSolution(matrix: DecisionMatrix): number[] {
    return this.weights.map((_, criterionIndex) =>
      Math.min(...matrix.map((alternativeValues) => alternativeValues[criterionIndex] ?? 0)),
    );
  }

  private getEuclideanDistances(matrix: DecisionMatrix, ideal: number[]): number[] {
    return matrix.map((alternativeValues) =>
      Math.sqrt(
        alternativeValues.reduce(
          (sum, value, criterionIndex) => sum + (value - (ideal[criterionIndex] ?? 0)) ** 2,
          0,
        ),
      ),
    );
  }

  private getTaxicabDistances(matrix: DecisionMatrix, ideal: number[]): number[] {
    return matrix.map((alternativeValues) =>
      alternativeValues.reduce(
        (sum, value, criterionIndex) => sum + Math.abs(value - (ideal[criterionIndex] ?? 0)),
        0,
      ),
    );
  }

  private getRelativeAssessmentMatrix(
    euclideanDistances: number[],
    taxicabDistances: number[],
  ): DecisionMatrix {
    return euclideanDistances.map((euclideanDistance, alternativeIndex) =>
      euclideanDistances.map((comparedEuclideanDistance, comparedIndex) => {
        const euclideanDifference = euclideanDistance - comparedEuclideanDistance;
        const useTaxicabDistance = Math.abs(euclideanDifference) >= this.tau;
        const taxicabDifference =
          (taxicabDistances[alternativeIndex] ?? 0) - (taxicabDistances[comparedIndex] ?? 0);

        return euclideanDifference + (useTaxicabDistance ? taxicabDifference : 0);
      }),
    );
  }
}
