import { AbstractNormalizedDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import { CriterionType } from "../../types";
import { divide, finiteVector, normalize, sum, validateData, weighted } from "../shared/numeric";

export class CoprasDecisionProblem extends AbstractNormalizedDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }

  public override get scores(): Scores {
    this.validate();
    const normalizedMatrix = normalize(
      this.matrix,
      this.types.map(() => CriterionType.BENEFIT),
      this.normalizationCallback,
    );
    if (normalizedMatrix.some((row) => row.some((x) => x < 0)))
      throw new Error("COPRAS requires non-negative normalized values.");
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const benefitSums = weightedMatrix.map((row) => sum(row.filter((_, j) => this.types[j] === 1)));
    const costSums = weightedMatrix.map((row) => sum(row.filter((_, j) => this.types[j] === -1)));
    const inverseCostSum = sum(costSums.map((x) => divide(1, x)));
    const priorities = benefitSums.map(
      (x, i) => x + divide(sum(costSums), costSums[i] * inverseCostSum),
    );
    const scores = priorities.map((x) => divide(x, Math.max(...priorities)));
    this.addToDebugBag("benefitSums", benefitSums);
    this.addToDebugBag("costSums", costSums);
    this.addToDebugBag("priorities", priorities);
    finiteVector(scores, this.matrix.length, "Scores");
    this.addToDebugBag("normalizedMatrix", normalizedMatrix);
    this.addToDebugBag("weightedMatrix", weightedMatrix);
    this.addToDebugBag("scores", scores);
    return scores;
  }
}
