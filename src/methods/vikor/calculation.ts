import { columns, sum } from "../shared/numeric";

/** Matrix must already be oriented so that larger values are better. */
export function calculateVikor(
  matrix: number[][],
  weights: number[],
  v: number,
  equalRange: "zero" | "pyrepo" = "zero",
) {
  const cols = columns(matrix);
  const fstar = cols.map((col) => Math.max(...col));
  const fminus = cols.map((col) => Math.min(...col));
  const equalCriteria = fstar.flatMap((x, j) => (x === fminus[j] ? [j] : []));
  if (equalCriteria.length)
    throw new Error(
      `Criteria with indexes ${equalCriteria.join(", ")} contain equal values for all alternatives. VIKOR cannot be applied.`,
    );
  const weightedDistances = matrix.map((row) =>
    row.map((x, j) => (weights[j] * (fstar[j] - x)) / (fstar[j] - fminus[j])),
  );
  const S = weightedDistances.map(sum);
  const R = weightedDistances.map((row) => Math.max(...row));
  const scaled = (values: number[]): number[] => {
    const min = Math.min(...values),
      max = Math.max(...values);
    if (min === max) return values.map((x) => (equalRange === "pyrepo" ? x : 0));
    return values.map((x) => (x - min) / (max - min));
  };
  const scaledS = scaled(S),
    scaledR = scaled(R);
  const Q = S.map((_, i) => v * scaledS[i] + (1 - v) * scaledR[i]);
  return { normalizedMatrix: matrix, fstar, fminus, weightedDistances, S, R, Q };
}
