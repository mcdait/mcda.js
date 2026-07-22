import { CriterionType, DecisionMatrix, Scores } from "../../types";
import { AbstractDecisionProblem } from "../../core";

export class SpotisDecisionProblem extends AbstractDecisionProblem {
  protected _bounds: number[][] = [];

  public get bounds(): number[][] {
    return this._bounds;
  }

  public set bounds(bounds: number[][]) {
    this._bounds = bounds;
  }

  public get isp(): number[] {
    if (this.bounds.length === 0) {
      return [];
    }

    if (this.bounds.length != this.types.length) {
      throw new Error("The number of bounds must match the number of criteria types.");
    }

    // Implementation for ISP calculation
    let _isp: number[] = [];

    for (let i = 0; i < this.bounds.length; i++) {
      _isp.push(this.types[i] === CriterionType.COST ? this.bounds[i][0] : this.bounds[i][1]);
    }

    return _isp;
  }

  public get scores(): Scores {
    this.validate();
    const scores = this.spotis();

    return scores;
  }

  protected override validate(): void {
    super.validate();

    if (this.bounds.length !== this.weights.length) {
      throw new Error(
        `The number of bounds (${this.bounds.length}) must match the number of criteria (${this.weights.length}).`,
      );
    }
  }

  private spotis(): Scores {
    const isp = this.isp;
    this.addToDebugBag("isp", isp);

    const normalizedMatrix: DecisionMatrix = this.matrix.map((alternative) =>
      alternative.map((value, criterionIndex) => {
        const [lowerBound, upperBound] = this.bounds[criterionIndex];

        return Math.abs(value - isp[criterionIndex]) / Math.abs(upperBound - lowerBound);
      }),
    );
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);

    const D = normalizedMatrix.map((alternative) =>
      alternative.reduce(
        (distance, value, criterionIndex) => distance + this.weights[criterionIndex] * value,
        0,
      ),
    );
    this.addToDebugBag("D", D);

    return D;
  }
}
