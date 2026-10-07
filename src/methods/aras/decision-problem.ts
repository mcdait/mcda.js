import { AbstractNormalizedDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import {
  columns,
  divide,
  finiteVector,
  normalize,
  sum,
  validateData,
  weighted,
} from "../shared/numeric";

export class ArasDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    const ideal = columns(this.matrix).map((col, j) =>
      this.types[j] === 1 ? Math.max(...col) : Math.min(...col),
    );
    const extendedMatrix = [ideal, ...this.matrix];
    const normalizedMatrix = normalize(extendedMatrix, this.types, this.normalizationCallback);
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const utilities = weightedMatrix.map(sum);
    const scores = utilities.slice(1).map((x) => divide(x, utilities[0]));
    this.addToDebugBag("ideal", ideal);
    this.addToDebugBag("extendedMatrix", extendedMatrix);
    this.addToDebugBag("utilities", utilities);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
