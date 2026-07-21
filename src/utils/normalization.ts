import { CriterionType, DecisionMatrix } from "../types";

export function vectorNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  if (!matrix.length) {
    throw new Error("Decision problem matrix requires at least one alternative.");
  }
  const criteriaCount = matrix[0].length;
  const divisors = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    const sumOfSquares = matrix.reduce((sum, alternativeValues) => {
      const value = alternativeValues[criterionIndex]!;

      return sum + value ** 2;
    }, 0);

    return Math.sqrt(sumOfSquares);
  });

  const normalizedMatrix: DecisionMatrix = [];

  for (let alternativeIndex = 0; alternativeIndex < matrix.length; alternativeIndex++) {
    const alternativeValues = matrix[alternativeIndex];
    const normalizedAlternativeValues: number[] = [];

    for (let criterionIndex = 0; criterionIndex < alternativeValues.length; criterionIndex++) {
      const value = alternativeValues[criterionIndex];
      const divisor = divisors[criterionIndex];
      if (divisor === 0) {
        throw new Error(
          `Cannot normalize criterion at index ${criterionIndex} because the divisor is zero.`,
        );
      }

      if (types[criterionIndex] === CriterionType.COST) {
        normalizedAlternativeValues.push(1 - value / divisor);
      } else {
        normalizedAlternativeValues.push(value / divisor);
      }
    }

    normalizedMatrix.push(normalizedAlternativeValues);
  }

  return normalizedMatrix;
}
