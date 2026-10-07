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

export class CradisDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    const normalizedMatrix = normalize(this.matrix, this.types, this.normalizationCallback);
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const maximum = Math.max(...weightedMatrix.flat());
    const minimum = Math.min(...weightedMatrix.flat());
    const positiveDistances = weightedMatrix.map((row) => sum(row.map((x) => maximum - x)));
    const negativeDistances = weightedMatrix.map((row) => sum(row.map((x) => x - minimum)));
    const best = columns(weightedMatrix).map((col) => Math.max(...col));
    const optimalPositiveDistance = sum(best.map((x) => maximum - x));
    const optimalNegativeDistance = sum(best.map((x) => x - minimum));
    const positiveUtilities = positiveDistances.map((x) => divide(optimalPositiveDistance, x));
    const negativeUtilities = negativeDistances.map((x) => divide(x, optimalNegativeDistance));
    const scores = positiveUtilities.map((x, i) => (x + negativeUtilities[i]) / 2);
    for (const [name, value] of Object.entries({
      positiveDistances,
      negativeDistances,
      optimalPositiveDistance,
      optimalNegativeDistance,
      positiveUtilities,
      negativeUtilities,
    }))
      this.addToDebugBag(name, value);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
