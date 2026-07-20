import { ctranspose, dotMultiply, norm } from "mathjs";
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

    const normalizedMatrix = this.normalizationCallback(this.matrix);
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
    return matrix.map(
      (alternativeValues) => dotMultiply(alternativeValues, this.weights) as number[],
    );
  }

  private getIdealValues(matrix: DecisionMatrix, bestValues: boolean): number[] {
    const criteriaValues = ctranspose(matrix) as number[][];

    return criteriaValues.map((criterionValues, criterionIndex) => {
      const criterionType = this.types[criterionIndex];
      const benefitValue = bestValues ? Math.max : Math.min;
      const costValue = bestValues ? Math.min : Math.max;
      const picker = criterionType === CriterionType.BENEFIT ? benefitValue : costValue;

      return picker(...criterionValues);
    });
  }

  private getDistances(matrix: DecisionMatrix, idealValues: number[]): number[] {
    return matrix.map((alternativeValues) => {
      const distanceValues = alternativeValues.map((value, criterionIndex) => {
        const idealValue = idealValues[criterionIndex] ?? 0;

        return value - idealValue;
      });

      return Number(norm(distanceValues));
    });
  }
}
