import { ctranspose, norm } from "mathjs";
import type { DecisionMatrix } from "../types";

export function vectorNormalizationCallback(matrix: DecisionMatrix): DecisionMatrix {
  const criteriaValues = ctranspose(matrix) as number[][];
  const divisors = criteriaValues.map((values) => Number(norm(values)));

  return matrix.map((alternativeValues) =>
    alternativeValues.map((value, criterionIndex) => {
      const divisor = divisors[criterionIndex] ?? 0;

      return divisor === 0 ? 0 : value / divisor;
    }),
  );
}
