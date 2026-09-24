import { calculateVikor } from "./calculation";
import type { Scores } from "../../types";
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
    const results = calculateVikor(
      this.normalizationCallback(this.matrix, this.types),
      this.weights,
      this.v,
    );
    for (const [name, value] of Object.entries(results)) this.addToDebugBag(name, value);
    return results.Q;
  }
}
