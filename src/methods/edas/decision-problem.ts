import { AbstractDecisionProblem } from "../../core";
import { CriterionType } from "../../types";
import type { DecisionMatrix, Scores } from "../../types";

export class EdasDecisionProblem extends AbstractDecisionProblem {
  public override get scores(): Scores {
    this.validate();
    return this.edas();
  }

  private edas(): Scores {
    const averageSolution = this.getAverageSolution();
    this.addToDebugBag("averageSolution", averageSolution);

    const positiveDistanceMatrix = this.getDistanceMatrix(averageSolution, true);
    this.addToDebugBag("positiveDistanceMatrix", positiveDistanceMatrix);

    const negativeDistanceMatrix = this.getDistanceMatrix(averageSolution, false);
    this.addToDebugBag("negativeDistanceMatrix", negativeDistanceMatrix);

    const weightedPositiveDistances = this.getWeightedDistances(positiveDistanceMatrix);
    this.addToDebugBag("weightedPositiveDistances", weightedPositiveDistances);

    const weightedNegativeDistances = this.getWeightedDistances(negativeDistanceMatrix);
    this.addToDebugBag("weightedNegativeDistances", weightedNegativeDistances);

    const normalizedPositiveDistances = this.normalizePositiveDistances(weightedPositiveDistances);
    this.addToDebugBag("normalizedPositiveDistances", normalizedPositiveDistances);

    const normalizedNegativeDistances = this.normalizeNegativeDistances(weightedNegativeDistances);
    this.addToDebugBag("normalizedNegativeDistances", normalizedNegativeDistances);

    const appraisalScores = normalizedPositiveDistances.map(
      (positiveDistance, alternativeIndex) =>
        0.5 * (positiveDistance + (normalizedNegativeDistances[alternativeIndex] ?? 0)),
    );
    this.addToDebugBag("appraisalScores", appraisalScores);

    return appraisalScores;
  }

  private getAverageSolution(): number[] {
    return this.weights.map((_, criterionIndex) => {
      const sum = this.matrix.reduce(
        (total, alternativeValues) => total + (alternativeValues[criterionIndex] ?? 0),
        0,
      );
      const average = sum / this.matrix.length;

      if (average === 0) {
        throw new Error(
          `EDAS average solution for criterion at index ${criterionIndex} must not be zero.`,
        );
      }

      return average;
    });
  }

  private getDistanceMatrix(averageSolution: number[], positive: boolean): DecisionMatrix {
    return this.matrix.map((alternativeValues) =>
      alternativeValues.map((value, criterionIndex) => {
        const average = averageSolution[criterionIndex];

        if (average === undefined) {
          throw new Error("EDAS average solution value is required.");
        }

        const isBenefit = this.types[criterionIndex] === CriterionType.BENEFIT;
        const difference = isBenefit === positive ? value - average : average - value;

        return Math.max(0, difference / average);
      }),
    );
  }

  private getWeightedDistances(matrix: DecisionMatrix): number[] {
    return matrix.map((alternativeValues) =>
      alternativeValues.reduce(
        (sum, value, criterionIndex) => sum + value * (this.weights[criterionIndex] ?? 0),
        0,
      ),
    );
  }

  private normalizePositiveDistances(distances: number[]): number[] {
    const maximum = Math.max(...distances);

    return maximum === 0 ? distances.map(() => 0) : distances.map((value) => value / maximum);
  }

  private normalizeNegativeDistances(distances: number[]): number[] {
    const maximum = Math.max(...distances);

    return maximum === 0 ? distances.map(() => 1) : distances.map((value) => 1 - value / maximum);
  }
}
