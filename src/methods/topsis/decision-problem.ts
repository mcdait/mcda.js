import { CriterionType } from "../../types";
import type { DecisionMatrix, Scores } from "../../types";
import { AbstractNormalizedDecisionProblem } from "../../core";

export class TopsisDecisionProblem extends AbstractNormalizedDecisionProblem {
  public get scores(): Scores {
    this.validate();
    return this.topsis();
  }

  private topsis(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("TOPSIS requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizationCallback(this.matrix, this.types);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    const weightedNormalizedMatrix = this.applyWeights(normalizedMatrix);
    this.addToDebugBag("weightedNormalizedMatrix", weightedNormalizedMatrix);
    const idealBest = this.getIdealValues(weightedNormalizedMatrix, true);
    this.addToDebugBag("idealBest", idealBest);
    const idealWorst = this.getIdealValues(weightedNormalizedMatrix, false);
    this.addToDebugBag("idealWorst", idealWorst);
    const distanceToBest = this.getDistances(weightedNormalizedMatrix, idealBest);
    this.addToDebugBag("distanceToBest", distanceToBest);
    const distanceToWorst = this.getDistances(weightedNormalizedMatrix, idealWorst);
    this.addToDebugBag("distanceToWorst", distanceToWorst);
    const scores = distanceToWorst.map((worstDistance, alternativeIndex) => {
      const bestDistance = distanceToBest[alternativeIndex] ?? 0;
      const denominator = bestDistance + worstDistance;

      return denominator === 0 ? 0 : worstDistance / denominator;
    });

    return scores;
  }

  private applyWeights(matrix: DecisionMatrix): DecisionMatrix {
    return matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => {
        const weight = this.weights[criterionIndex] ?? 0;

        return value * weight;
      }),
    );
  }

  private getIdealValues(matrix: DecisionMatrix, bestValues: boolean): number[] {
    return this.weights.map((_, criterionIndex) => {
      const criterionValues = matrix.map(
        (alternativeValues) => alternativeValues[criterionIndex] ?? 0,
      );

      if (bestValues) {
        const positiveIdealValues = Math.max(...criterionValues);

        return positiveIdealValues;
      } else {
        const negativeIdealValues = Math.min(...criterionValues);

        return negativeIdealValues;
      }
    });
  }

  private getDistances(matrix: DecisionMatrix, idealValues: number[]): number[] {
    return matrix.map((alternativeValues) => {
      const sumOfSquares = alternativeValues.reduce((sum, value, criterionIndex) => {
        const idealValue = idealValues[criterionIndex] ?? 0;

        return sum + (value - idealValue) ** 2;
      }, 0);

      return Math.sqrt(sumOfSquares);
    });
  }
}
