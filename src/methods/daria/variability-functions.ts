import { columns, divide, sum, validateMatrix } from "../shared/numeric";
import type { VariabilityCallback } from "../../types";

function preferenceColumns(matrix: number[][]): number[][] {
  validateMatrix(matrix, matrix.length, matrix[0]?.length ?? 0);
  return columns(matrix);
}

export const varianceVariability: VariabilityCallback = (matrix) =>
  preferenceColumns(matrix).map((values) => {
    const mean = sum(values) / values.length;
    return divide(sum(values.map((value) => (value - mean) ** 2)), values.length);
  });

/** Population standard deviation across periods. */
export const standardDeviationVariability: VariabilityCallback = (matrix) =>
  varianceVariability(matrix).map(Math.sqrt);

export const giniVariability: VariabilityCallback = (matrix) =>
  preferenceColumns(matrix).map((values) => {
    const count = values.length;
    const mean = sum(values) / count;
    // Use the signed mean, with a separate denominator for zero-mean scores.
    const denominator = mean === 0 ? count ** 2 - count : 2 * count ** 2 * mean;
    return sum(
      values.map((left) => sum(values.map((right) => divide(Math.abs(left - right), denominator)))),
    );
  });

export const entropyVariability: VariabilityCallback = (matrix) =>
  preferenceColumns(matrix).map((values) => {
    const total = sum(values);
    const terms = values.map((value) => {
      const probability = Math.abs(divide(value, total));
      return probability === 0 ? 0 : probability * Math.log(probability);
    });
    return 1 + divide(sum(terms), Math.log(values.length));
  });

/** Sample deviation of sum-normalized scores divided by their mean. */
export const coefficientOfVariationVariability: VariabilityCallback = (matrix) =>
  preferenceColumns(matrix).map((values) => {
    const total = sum(values);
    const normalized = values.map((value) => divide(value, total));
    const mean = sum(normalized) / values.length;
    const deviation = Math.sqrt(
      divide(sum(normalized.map((value) => (value - mean) ** 2)), values.length - 1),
    );
    return divide(deviation, mean);
  });
