import { AbstractNormalizedDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import { finiteVector, normalize, sum, validateData, weighted } from "../shared/numeric";

export class AhpDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    const normalizedMatrix = normalize(this.matrix, this.types, this.normalizationCallback);
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const scores = weightedMatrix.map(sum);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
