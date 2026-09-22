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

export function linearNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  const criteriaCount = matrix[0]?.length ?? 0;
  const ranges = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    const criterionValues = matrix.map(
      (alternativeValues) => alternativeValues[criterionIndex] ?? 0,
    );

    return {
      min: Math.min(...criterionValues),
      max: Math.max(...criterionValues),
    };
  });

  return matrix.map((alternativeValues) =>
    alternativeValues.map((value, criterionIndex) => {
      const range = ranges[criterionIndex];

      if (range === undefined) {
        throw new Error("Linear normalization criterion range is required.");
      }

      const denominator = range.max - range.min;

      if (denominator === 0) {
        return 0;
      }

      if (types[criterionIndex] === CriterionType.COST) {
        return (range.max - value) / denominator;
      }

      return (value - range.min) / denominator;
    }),
  );
}

export function maxNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  if (!matrix.length) {
    return matrix;
  }

  const criteriaCount = matrix[0].length;

  const maxima = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    const criterionValues = matrix.map((alternativeValues) => alternativeValues[criterionIndex]);

    return Math.max(...criterionValues);
  });

  const normalizedMatrix: DecisionMatrix = [];

  for (const alternativeValues of matrix) {
    const normalizedAlternativeValues: number[] = [];

    for (let criterionIndex = 0; criterionIndex < criteriaCount; criterionIndex++) {
      const maximum = maxima[criterionIndex] ?? 0;

      if (maximum === 0) {
        throw new Error(
          `Cannot normalize criterion at index ${criterionIndex} because the maximum value is zero.`,
        );
      }

      const value = alternativeValues[criterionIndex];
      const normalizedValue = value / maximum;

      if (types[criterionIndex] === CriterionType.COST) {
        normalizedAlternativeValues.push(1 - normalizedValue);
      } else {
        normalizedAlternativeValues.push(normalizedValue);
      }
    }

    normalizedMatrix.push(normalizedAlternativeValues);
  }

  return normalizedMatrix;
}

export function minMaxNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  if (!matrix.length) {
    return matrix;
  }

  const criteriaCount = matrix[0].length;
  const ranges = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    const criterionValues = matrix.map(
      (alternativeValues) => alternativeValues[criterionIndex] ?? 0,
    );

    return {
      min: Math.min(...criterionValues),
      max: Math.max(...criterionValues),
    };
  });

  const normalizedMatrix: DecisionMatrix = [];

  for (const alternativeValues of matrix) {
    const normalizedAlternativeValues: number[] = [];

    for (let criterionIndex = 0; criterionIndex < criteriaCount; criterionIndex++) {
      const range = ranges[criterionIndex];

      if (range === undefined) {
        throw new Error("Min-max normalization criterion range is required.");
      }

      const denominator = range.max - range.min;

      if (denominator === 0) {
        throw new Error(
          `Cannot normalize criterion at index ${criterionIndex} because all values are equal.`,
        );
      }

      const value = alternativeValues[criterionIndex];

      if (types[criterionIndex] === CriterionType.COST) {
        normalizedAlternativeValues.push((range.max - value) / denominator);
      } else {
        normalizedAlternativeValues.push((value - range.min) / denominator);
      }
    }

    normalizedMatrix.push(normalizedAlternativeValues);
  }

  return normalizedMatrix;
}

export function sumNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  if (!matrix.length) {
    return matrix;
  }

  for (const alternativeValues of matrix) {
    for (const alternativeValue of alternativeValues) {
      if (alternativeValue < 0) {
        throw new Error("Sum normalization requires that none of the values are negative");
      }
    }
  }

  const criteriaCount = matrix[0].length;

  const divisors = Array.from({ length: criteriaCount }, (_, criterionIndex) => {
    if (types[criterionIndex] === CriterionType.COST) {
      return matrix.reduce((sum, alternativeValues) => {
        const value = alternativeValues[criterionIndex];

        if (value === 0) {
          throw new Error(
            `Cannot normalize criterion at index ${criterionIndex} because it contains zero values`,
          );
        }

        return sum + 1 / value;
      }, 0);
    }

    return matrix.reduce((sum, alternativeValues) => {
      return sum + alternativeValues[criterionIndex];
    }, 0);
  });

  const normalizedMatrix: DecisionMatrix = [];

  for (const alternativeValues of matrix) {
    const normalizedAlternativeValues: number[] = [];

    for (let criterionIndex = 0; criterionIndex < criteriaCount; criterionIndex++) {
      const divisor = divisors[criterionIndex] ?? 0;

      if (divisor === 0) {
        throw new Error(
          `Cannot normalize criterion at index ${criterionIndex} because the divisor is zero`,
        );
      }

      const value = alternativeValues[criterionIndex];

      if (types[criterionIndex] === CriterionType.COST) {
        normalizedAlternativeValues.push(1 / value / divisor);
      } else {
        normalizedAlternativeValues.push(value / divisor);
      }
    }

    normalizedMatrix.push(normalizedAlternativeValues);
  }

  return normalizedMatrix;
}

/** pyrepo_mcda linear normalization: benefit x/max, cost min/x. */
export function ratioNormalizationCallback(
  matrix: DecisionMatrix,
  types: CriterionType[],
): DecisionMatrix {
  if (!matrix.length || !matrix[0].length)
    throw new Error("Normalization requires a non-empty matrix.");
  const count = matrix[0].length;
  if (
    types.length !== count ||
    types.some((t) => t !== 1 && t !== -1) ||
    matrix.some((row) => row.length !== count || row.some((x) => !Number.isFinite(x) || x <= 0))
  ) {
    throw new Error(
      "Ratio normalization requires positive finite values and matching criterion types.",
    );
  }
  const minima = matrix[0].map((_, j) => Math.min(...matrix.map((row) => row[j])));
  const maxima = matrix[0].map((_, j) => Math.max(...matrix.map((row) => row[j])));
  return matrix.map((row) =>
    row.map((x, j) => (types[j] === CriterionType.COST ? minima[j] / x : x / maxima[j])),
  );
}

/** Vector magnitudes without converting cost criteria into benefits. */
export function vectorMagnitudeNormalizationCallback(
  matrix: DecisionMatrix,
  _types?: CriterionType[],
): DecisionMatrix {
  if (!matrix.length || !matrix[0].length)
    throw new Error("Normalization requires a non-empty matrix.");
  const count = matrix[0].length;
  if (matrix.some((row) => row.length !== count || row.some((x) => !Number.isFinite(x)))) {
    throw new Error("Vector magnitude normalization requires a rectangular finite matrix.");
  }
  const divisors = matrix[0].map((_, j) => Math.hypot(...matrix.map((row) => row[j])));
  if (divisors.some((x) => x === 0 || !Number.isFinite(x)))
    throw new Error("Vector magnitude divisor must be finite and positive.");
  return matrix.map((row) => row.map((x, j) => x / divisors[j]));
}
