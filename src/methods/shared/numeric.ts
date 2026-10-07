import { CriterionType } from "../../types";
import type { DecisionMatrix, NormalizationCallback } from "../../types/core";

export const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
export const columns = (matrix: DecisionMatrix): number[][] =>
  matrix[0].map((_, j) => matrix.map((row) => row[j]));
export const weighted = (matrix: DecisionMatrix, weights: number[]): DecisionMatrix =>
  matrix.map((row) => row.map((value, j) => value * weights[j]));

export function finiteVector(values: number[], length: number, name: string): void {
  if (values.length !== length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${name} must contain ${length} finite values.`);
  }
}

export function validateMatrix(matrix: DecisionMatrix, rows: number, cols: number): void {
  if (rows < 1 || cols < 1 || matrix.length !== rows) {
    throw new Error("Matrix must have non-empty, matching dimensions.");
  }
  matrix.forEach((row) => finiteVector(row, cols, "Matrix row"));
}

export function validateWeights(weights: number[], count: number): void {
  finiteVector(weights, count, "Weights");
  if (weights.some((w) => w < 0) || !Number.isFinite(sum(weights)) || !(sum(weights) > 0)) {
    throw new Error("Weights must be non-negative with a positive sum.");
  }
}

export function validateData(
  matrix: DecisionMatrix,
  weights: number[],
  types: CriterionType[],
): void {
  validateMatrix(matrix, matrix.length, weights.length);
  validateWeights(weights, weights.length);
  if (types.length !== weights.length || types.some((t) => t !== 1 && t !== -1)) {
    throw new Error("One benefit or cost type is required per criterion.");
  }
}

export function normalize(
  matrix: DecisionMatrix,
  types: CriterionType[],
  callback: NormalizationCallback | undefined,
): DecisionMatrix {
  if (typeof callback !== "function")
    throw new Error("This method requires a normalization callback.");
  const result = callback(
    matrix.map((row) => [...row]),
    [...types],
  );
  validateMatrix(result, matrix.length, types.length);
  return result;
}

export function divide(numerator: number, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator === 0) {
    throw new Error("The method is undefined because a divisor is zero or non-finite.");
  }
  const result = numerator / denominator;
  if (!Number.isFinite(result)) throw new Error("The method produced a non-finite result.");
  return result;
}

export function unitInterval(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1.`);
  }
}

export function quantile(values: number[], probability: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
}

export function standardize(matrix: DecisionMatrix): DecisionMatrix {
  if (matrix.length < 2)
    throw new Error("Sample standardization requires at least two alternatives.");
  const stats = columns(matrix).map((col) => {
    const mean = sum(col) / col.length;
    const deviation = Math.sqrt(sum(col.map((x) => (x - mean) ** 2)) / (col.length - 1));
    if (deviation === 0) throw new Error("Cannot standardize a constant criterion.");
    return { mean, deviation };
  });
  return matrix.map((row) => row.map((x, j) => divide(x - stats[j].mean, stats[j].deviation)));
}
