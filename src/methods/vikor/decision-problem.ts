import type { DecisionMatrix, Scores } from "../../types";
import { AbstractNormalizedDecisionProblem } from "../../core";

export class VikorDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected _v = 0.5;

  public get v(): number {
    return this._v;
  }

  public set v(v: number) {
    this._v = v;
  }

  public get scores(): Scores {
    this.validate();
    const scores = this.vikor();

    return scores;
  }

  protected override validate(): void {
    super.validate();

    if (!Number.isFinite(this.v) || this.v < 0 || this.v > 1) {
      throw new Error("VIKOR parameter v must be between 0 and 1.");
    }

    if (this.normalizationCallback === undefined) {
      throw new Error("This VIKOR implementation requires a normalization callback.");
    }
  }

  private vikor(): Scores {
    if (this.normalizationCallback === undefined) {
      throw new Error("This VIKOR implementation requires a normalization callback.");
    }

    const normalizedMatrix = this.normalizationCallback(this.matrix, this.types);
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const fstar = this.getBestPerCriterion(normalizedMatrix);
    this.addToDebugBag("fstar", fstar);

    const fminus = this.getWorstPerCriterion(normalizedMatrix);
    this.addToDebugBag("fminus", fminus);

    this.validateIdealValues(fstar, fminus);

    const weightedDistances = this.getWeightedDistances(normalizedMatrix, fstar, fminus);
    this.addToDebugBag("weightedDistances", weightedDistances);

    const S = this.getS(weightedDistances);
    this.addToDebugBag("S", S);

    const R = this.getR(weightedDistances);
    this.addToDebugBag("R", R);

    const scores = this.getQ(S, R);
    this.addToDebugBag("Q", scores);

    return scores;
  }

  private getBestPerCriterion(matrix: DecisionMatrix): number[] {
    const bestPerCriterion: number[] = [];

    const criteriaCount = this.weights.length;

    for (let criterionIndex = 0; criterionIndex < criteriaCount; criterionIndex++) {
      let best = Number.NEGATIVE_INFINITY;

      for (const alternative of matrix) {
        const value = alternative[criterionIndex] ?? Number.NEGATIVE_INFINITY;

        if (value > best) {
          best = value;
        }
      }

      bestPerCriterion.push(best);
    }

    return bestPerCriterion;
  }

  private getWorstPerCriterion(matrix: DecisionMatrix): number[] {
    const worstPerCriterion: number[] = [];

    const criteriaCount = this.weights.length;

    for (let criterionIndex = 0; criterionIndex < criteriaCount; criterionIndex++) {
      let worst = Number.POSITIVE_INFINITY;

      for (const alternative of matrix) {
        const value = alternative[criterionIndex] ?? Number.NEGATIVE_INFINITY;

        if (value < worst) {
          worst = value;
        }
      }

      worstPerCriterion.push(worst);
    }

    return worstPerCriterion;
  }

  private validateIdealValues(fstar: number[], fminus: number[]): void {
    const equalCriteria: number[] = [];

    for (let i = 0; i < fstar.length; i++) {
      if (fstar[i] === fminus[i]) {
        equalCriteria.push(i);
      }
    }

    if (equalCriteria.length > 0) {
      throw new Error(
        `Criteria with indexes ${equalCriteria.join(", ")} contain equal values for all alternatives. VIKOR cannot be applied.`,
      );
    }
  }

  private getWeightedDistances(
    matrix: DecisionMatrix,
    idealBest: number[],
    idealWorst: number[],
  ): DecisionMatrix {
    const result: DecisionMatrix = [];

    for (const alternative of matrix) {
      const values: number[] = [];

      for (let criterionIndex = 0; criterionIndex < this.weights.length; criterionIndex++) {
        const numerator = (idealBest[criterionIndex] ?? 0) - (alternative[criterionIndex] ?? 0);
        const denominator = (idealBest[criterionIndex] ?? 0) - (idealWorst[criterionIndex] ?? 0);

        values.push(((this.weights[criterionIndex] ?? 0) * numerator) / denominator);
      }

      result.push(values);
    }

    return result;
  }

  private getS(weightedDistances: DecisionMatrix): number[] {
    const S: number[] = [];

    for (const alternative of weightedDistances) {
      let sum = 0;

      for (const value of alternative) {
        sum += value;
      }

      S.push(sum);
    }

    return S;
  }

  private getR(weightedDistances: DecisionMatrix): number[] {
    const R: number[] = [];

    for (const alternative of weightedDistances) {
      let max = Number.NEGATIVE_INFINITY;

      for (const value of alternative) {
        if (value > max) {
          max = value;
        }
      }

      R.push(max);
    }

    return R;
  }

  private getQ(S: number[], R: number[]): Scores {
    const SStar = Math.min(...S);
    const SMinus = Math.max(...S);

    const RStar = Math.min(...R);
    const RMinus = Math.max(...R);

    const scores: number[] = [];

    for (let alternativeIndex = 0; alternativeIndex < S.length; alternativeIndex++) {
      const s = SMinus === SStar ? 0 : ((S[alternativeIndex] ?? 0) - SStar) / (SMinus - SStar);

      const r = RMinus === RStar ? 0 : ((R[alternativeIndex] ?? 0) - RStar) / (RMinus - RStar);

      scores.push(this.v * s + (1 - this.v) * r);
    }

    return scores;
  }
}
