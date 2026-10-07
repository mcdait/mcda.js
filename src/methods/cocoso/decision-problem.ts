import { AbstractNormalizedDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import {
  divide,
  finiteVector,
  normalize,
  sum,
  unitInterval,
  validateData,
  weighted,
} from "../shared/numeric";

export class CocosoDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected _lambda = 0.5;
  public get lambda(): number {
    return this._lambda;
  }
  public set lambda(value: number) {
    this._lambda = value;
  }

  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    unitInterval(this.lambda, "COCOSO lambda");
    const normalizedMatrix = normalize(this.matrix, this.types, this.normalizationCallback);
    if (normalizedMatrix.some((row) => row.some((x) => x < 0)))
      throw new Error("COCOSO requires non-negative normalized values.");
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const weightedSums = weightedMatrix.map(sum);
    const powerSums = normalizedMatrix.map((row) => sum(row.map((x, j) => x ** this.weights[j])));
    const total = sum(weightedSums) + sum(powerSums);
    const minS = Math.min(...weightedSums),
      minP = Math.min(...powerSums);
    const maxS = Math.max(...weightedSums),
      maxP = Math.max(...powerSums);
    const kia = weightedSums.map((x, i) => divide(x + powerSums[i], total));
    const kib = weightedSums.map((x, i) => divide(x, minS) + divide(powerSums[i], minP));
    const kic = weightedSums.map((x, i) =>
      divide(
        this.lambda * x + (1 - this.lambda) * powerSums[i],
        this.lambda * maxS + (1 - this.lambda) * maxP,
      ),
    );
    const scores = kia.map((x, i) => Math.cbrt(x * kib[i] * kic[i]) + (x + kib[i] + kic[i]) / 3);
    for (const [name, value] of Object.entries({ weightedSums, powerSums, kia, kib, kic }))
      this.addToDebugBag(name, value);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
