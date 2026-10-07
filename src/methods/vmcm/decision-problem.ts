import { AbstractDecisionProblem } from "../../core";
import type { CriterionType, DecisionMatrix, Scores } from "../../types";
import {
  columns,
  divide,
  finiteVector,
  quantile,
  standardize,
  sum,
  validateData,
  weighted,
} from "../shared/numeric";

/** Patterns are expressed in standardized coordinates, as in pyrepo_mcda. */
export function determineVmcmPatterns(
  matrix: DecisionMatrix,
  types: CriterionType[],
): { pattern: number[]; antiPattern: number[] } {
  validateData(
    matrix,
    types.map(() => 1),
    types,
  );
  const cols = columns(standardize(matrix));
  return {
    pattern: cols.map((col, j) => quantile(col, types[j] === 1 ? 0.75 : 0.25)),
    antiPattern: cols.map((col, j) => quantile(col, types[j] === 1 ? 0.25 : 0.75)),
  };
}

export class VmcmDecisionProblem extends AbstractDecisionProblem {
  protected _pattern: number[] = [];
  protected _antiPattern: number[] = [];
  public get pattern(): number[] {
    return this._pattern;
  }
  public set pattern(value: number[]) {
    this._pattern = value;
  }
  public get antiPattern(): number[] {
    return this._antiPattern;
  }
  public set antiPattern(value: number[]) {
    this._antiPattern = value;
  }

  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
    finiteVector(this.pattern, this.weights.length, "VMCM pattern");
    finiteVector(this.antiPattern, this.weights.length, "VMCM anti-pattern");
  }

  public override get scores(): Scores {
    this.validate();
    const normalizedMatrix = standardize(this.matrix);
    const weightedMatrix = weighted(normalizedMatrix, this.weights);
    const direction = this.pattern.map((x, j) => x - this.antiPattern[j]);
    const denominator = sum(direction.map((x) => x ** 2));
    const scores = weightedMatrix.map((row) =>
      divide(sum(row.map((x, j) => (x - this.antiPattern[j]) * direction[j])), denominator),
    );
    for (const [name, value] of Object.entries({
      normalizedMatrix,
      weightedMatrix,
      direction,
      pattern: [...this.pattern],
      antiPattern: [...this.antiPattern],
      scores,
    }))
      this.addToDebugBag(name, value);
    return scores;
  }
}
