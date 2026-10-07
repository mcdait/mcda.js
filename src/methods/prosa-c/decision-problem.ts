import { AbstractDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import type { PreferenceFunction } from "../promethee/types";
import { finiteVector, sum, validateData } from "../shared/numeric";

export class ProsaCDecisionProblem extends AbstractDecisionProblem {
  protected _preferenceFunctions: PreferenceFunction[] = [];
  protected _s: number[] | undefined;
  public get preferenceFunctions(): PreferenceFunction[] {
    return this._preferenceFunctions;
  }
  public set preferenceFunctions(value: PreferenceFunction[]) {
    this._preferenceFunctions = value;
  }
  public get s(): number[] {
    return this._s ?? this.weights.map(() => 0.3);
  }
  public set s(value: number[] | undefined) {
    this._s = value;
  }

  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
    if (this.matrix.length < 2) throw new Error("PROSA-C requires at least two alternatives.");
    if (
      this.preferenceFunctions.length !== this.weights.length ||
      this.preferenceFunctions.some((f) => typeof f !== "function")
    ) {
      throw new Error("PROSA-C requires one preference function per criterion.");
    }
    finiteVector(this.s, this.weights.length, "PROSA-C sustainability coefficients");
    if (this.s.some((x) => x < 0))
      throw new Error("PROSA-C sustainability coefficients must be non-negative.");
  }

  public override get scores(): Scores {
    this.validate();
    const preference = (difference: number, j: number): number => {
      const value = this.preferenceFunctions[j](difference);
      if (!Number.isFinite(value) || value < 0 || value > 1)
        throw new Error("Preference functions must return finite values between 0 and 1.");
      return value;
    };
    const criterionFlows = this.matrix.map((row) =>
      row.map(
        (x, j) =>
          sum(
            this.matrix.map(
              (other) =>
                preference(this.types[j] * (x - other[j]), j) -
                preference(this.types[j] * (other[j] - x), j),
            ),
          ) /
          (this.matrix.length - 1),
      ),
    );
    const netFlows = criterionFlows.map((row) => sum(row.map((x, j) => x * this.weights[j])));
    const deviations = criterionFlows.map((row, i) =>
      sum(row.map((x, j) => Math.abs(netFlows[i] - x) * this.weights[j] * this.s[j])),
    );
    const scores = netFlows.map((x, i) => x - deviations[i]);
    finiteVector(scores, this.matrix.length, "PROSA-C scores");
    for (const [name, value] of Object.entries({ criterionFlows, netFlows, deviations, scores }))
      this.addToDebugBag(name, value);
    return scores;
  }
}
