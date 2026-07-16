import type { DecisionMatrix } from "../types";

export function vectorNormalizationCallback(matrix: DecisionMatrix): DecisionMatrix {
  const criteriaCount = matrix[0]?.length ?? 0;
  const divisors = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    const sumOfSquares = matrix.reduce((sum, alternativeValues) => {
      const value = alternativeValues[criterionIndex] ?? 0;

      return sum + value ** 2;
    }, 0);

    return Math.sqrt(sumOfSquares);
  });

  return matrix.map((alternativeValues) =>
    alternativeValues.map((value, criterionIndex) => {
      const divisor = divisors[criterionIndex] ?? 0;

      return divisor === 0 ? 0 : value / divisor;
    }),
  );
}
