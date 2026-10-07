import { AbstractDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import { columns, divide, finiteVector, sum, validateData, weighted } from "../shared/numeric";

export class MarcosDecisionProblem extends AbstractDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    if (this.matrix.some((row) => row.some((x) => x <= 0)))
      throw new Error("MARCOS requires positive values.");
    const ideal = columns(this.matrix).map((col, j) =>
      this.types[j] === 1 ? Math.max(...col) : Math.min(...col),
    );
    const antiIdeal = columns(this.matrix).map((col, j) =>
      this.types[j] === 1 ? Math.min(...col) : Math.max(...col),
    );
    const extendedMatrix = [antiIdeal, ...this.matrix, ideal];
    const normalizedMatrix = extendedMatrix.map((row) =>
      row.map((x, j) => (this.types[j] === 1 ? divide(x, ideal[j]) : divide(ideal[j], x))),
    );
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const sums = weightedMatrix.map(sum);
    const utilityMinus = sums.map((x) => divide(x, sums[0]));
    const utilityPlus = sums.map((x) => divide(x, sums[sums.length - 1]));
    const utilityFunctionMinus = utilityPlus.map((x, i) => divide(x, x + utilityMinus[i]));
    const utilityFunctionPlus = utilityMinus.map((x, i) => divide(x, x + utilityPlus[i]));
    const scores = utilityPlus
      .map((x, i) =>
        divide(
          x + utilityMinus[i],
          1 +
            divide(1 - utilityFunctionPlus[i], utilityFunctionPlus[i]) +
            divide(1 - utilityFunctionMinus[i], utilityFunctionMinus[i]),
        ),
      )
      .slice(1, -1);
    for (const [name, value] of Object.entries({
      ideal,
      antiIdeal,
      extendedMatrix,
      sums,
      utilityMinus,
      utilityPlus,
      utilityFunctionMinus,
      utilityFunctionPlus,
    }))
      this.addToDebugBag(name, value);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
