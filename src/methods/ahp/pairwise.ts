import type { DebugBag, DecisionMatrix, Scores } from "../../types";
import { finiteVector, sum, validateMatrix, validateWeights } from "../shared/numeric";

export type AhpPriorityMethod = (matrix: DecisionMatrix) => number[];
export type AhpConsistency = {
  lambdaMax: number;
  consistencyIndex: number;
  consistencyRatio: number | undefined;
  consistent: boolean | undefined;
};
export type AhpPairwiseDebugResults = {
  priorities: number[][];
  consistency: AhpConsistency[];
  scores: number[];
};

function validatePairwise(matrix: DecisionMatrix): void {
  validateMatrix(matrix, matrix.length, matrix.length);
  for (let i = 0; i < matrix.length; i++) {
    if (Math.abs(matrix[i][i] - 1) > 1e-10) throw new Error("AHP pairwise diagonal must equal 1.");
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] <= 0 || Math.abs(matrix[i][j] * matrix[j][i] - 1) > 1e-8) {
        throw new Error("AHP pairwise matrices must be positive and reciprocal.");
      }
    }
  }
}

/** Perron eigenvector computed by power iteration on a positive matrix. */
export function ahpEigenvector(
  matrix: DecisionMatrix,
  tolerance = 1e-12,
  maxIterations = 10000,
): number[] {
  validatePairwise(matrix);
  if (
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 1
  ) {
    throw new Error("AHP iteration settings must be positive and finite.");
  }
  let priority = matrix.map(() => 1 / matrix.length);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const product = matrix.map((row) => sum(row.map((x, j) => x * priority[j])));
    const total = sum(product);
    if (!Number.isFinite(total) || total <= 0)
      throw new Error("AHP eigenvector calculation overflowed.");
    const next = product.map((x) => x / total);
    if (Math.max(...next.map((x, j) => Math.abs(x - priority[j]))) < tolerance) return next;
    priority = next;
  }
  throw new Error("AHP eigenvector calculation did not converge.");
}

/** Matches pyrepo's _normalized_column_sum (normalized row sums). */
export const ahpNormalizedColumnSum: AhpPriorityMethod = (matrix) => {
  validatePairwise(matrix);
  const totals = matrix.map(sum),
    total = sum(totals);
  if (!Number.isFinite(total)) throw new Error("AHP row sum overflowed.");
  return totals.map((x) => x / total);
};

export const ahpGeometricMean: AhpPriorityMethod = (matrix) => {
  validatePairwise(matrix);
  const logs = matrix.map((row) => sum(row.map(Math.log)) / row.length);
  const maximum = Math.max(...logs);
  const geometric = logs.map((x) => Math.exp(x - maximum));
  return geometric.map((x) => x / sum(geometric));
};

export function ahpConsistency(matrix: DecisionMatrix): AhpConsistency {
  const priority = ahpEigenvector(matrix);
  const n = matrix.length;
  const lambdaMax =
    sum(matrix.map((row, i) => sum(row.map((x, j) => x * priority[j])) / priority[i])) / n;
  const consistencyIndex = n <= 2 ? 0 : Math.max(0, (lambdaMax - n) / (n - 1));
  const randomIndex = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n - 1];
  const consistencyRatio =
    n <= 2 ? 0 : randomIndex === undefined ? undefined : consistencyIndex / randomIndex;
  return {
    lambdaMax,
    consistencyIndex,
    consistencyRatio,
    consistent: consistencyRatio === undefined ? undefined : consistencyRatio <= 0.1,
  };
}

/** Classic AHP: one pairwise comparison matrix per criterion. */
export class AhpPairwiseDecisionProblem {
  protected _alternativeMatrices: DecisionMatrix[] = [];
  protected _weights: number[] = [];
  protected _priorityMethod: AhpPriorityMethod = ahpEigenvector;
  protected _debugBag: DebugBag | undefined;
  public get alternativeMatrices(): DecisionMatrix[] {
    return this._alternativeMatrices;
  }
  public set alternativeMatrices(value: DecisionMatrix[]) {
    this._alternativeMatrices = value;
  }
  public get weights(): number[] {
    return this._weights;
  }
  public set weights(value: number[]) {
    this._weights = value;
  }
  public get priorityMethod(): AhpPriorityMethod {
    return this._priorityMethod;
  }
  public set priorityMethod(value: AhpPriorityMethod) {
    this._priorityMethod = value;
  }
  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }
  public enableDebug(enabled: boolean): void {
    this._debugBag = enabled ? {} : undefined;
  }

  public get scores(): Scores {
    const matrices = this.alternativeMatrices;
    if (!matrices.length) throw new Error("Classic AHP requires pairwise matrices.");
    validateWeights(this.weights, matrices.length);
    if (typeof this.priorityMethod !== "function")
      throw new Error("An AHP priority method is required.");
    const m = matrices[0].length;
    matrices.forEach((matrix) => {
      validateMatrix(matrix, m, m);
      validatePairwise(matrix);
    });
    const priorities = matrices.map((matrix) => {
      const p = this.priorityMethod(matrix.map((row) => [...row]));
      finiteVector(p, m, "AHP priority vector");
      if (p.some((x) => x < 0) || Math.abs(sum(p) - 1) > 1e-8)
        throw new Error("AHP priority vectors must be non-negative and sum to 1.");
      return p;
    });
    const scores = Array.from(
      { length: m },
      (_, i) => sum(priorities.map((p, j) => p[i] * this.weights[j])) / sum(this.weights),
    );
    finiteVector(scores, m, "AHP scores");
    if (this._debugBag)
      Object.assign(this._debugBag, {
        priorities,
        consistency: matrices.map(ahpConsistency),
        scores,
      });
    return scores;
  }
}
