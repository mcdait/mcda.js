import type { DecisionMatrix } from "../../types";
import { sum, validateMatrix } from "../shared/numeric";
import type { AhpPriorityMethod } from "./types";

/** Validate the numerical domain needed by standalone priority calculations. */
function validatePriorityMatrix(matrix: DecisionMatrix): void {
  validateMatrix(matrix, matrix.length, matrix.length);
  if (matrix.some((row) => row.some((value) => value <= 0))) {
    throw new Error("Priority calculations require a positive matrix.");
  }
}

/** Perron eigenvector computed by power iteration on a positive matrix. */
export function eigenvectorPriority(
  matrix: DecisionMatrix,
  tolerance = 1e-12,
  maxIterations = 10000,
): number[] {
  validatePriorityMatrix(matrix);
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

/** Normalize row sums into a priority vector. */
export const normalizedRowSumPriority: AhpPriorityMethod = (matrix) => {
  validatePriorityMatrix(matrix);
  const totals = matrix.map(sum),
    total = sum(totals);
  if (!Number.isFinite(total)) throw new Error("AHP row sum overflowed.");
  return totals.map((x) => x / total);
};

export const geometricMeanPriority: AhpPriorityMethod = (matrix) => {
  validatePriorityMatrix(matrix);
  const logs = matrix.map((row) => sum(row.map(Math.log)) / row.length);
  const maximum = Math.max(...logs);
  const geometric = logs.map((x) => Math.exp(x - maximum));
  return geometric.map((x) => x / sum(geometric));
};
