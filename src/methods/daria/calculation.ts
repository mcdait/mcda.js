import { CriterionType } from "../../types";
import type { DecisionMatrix } from "../../types";
import { finiteVector, validateMatrix } from "../shared/numeric";
import type {
  DariaDirection,
  DariaDirectionLabel,
  DariaResult,
  VariabilityCallback,
} from "./types";

export function calculateDaria(
  matrix: DecisionMatrix,
  variabilityCallback: VariabilityCallback,
  preferenceType: CriterionType,
): DariaResult {
  const count = matrix[0]?.length ?? 0;
  validateMatrix(matrix, matrix.length, count);
  if (preferenceType !== CriterionType.BENEFIT && preferenceType !== CriterionType.COST)
    throw new Error("DARIA preference type must be 1 or -1.");
  if (typeof variabilityCallback !== "function")
    throw new Error("DARIA requires a callable variability callback.");
  const variability = variabilityCallback(matrix.map((row) => [...row]));
  finiteVector(variability, count, "DARIA variability");
  const direction = matrix[0].map((_, i) => {
    let change = 0;
    for (let period = 1; period < matrix.length; period++)
      change += matrix[period][i] - matrix[period - 1][i];
    return (change === 0 ? 0 : Math.sign(change)) as DariaDirection;
  });
  const directionLabels = direction.map((value): DariaDirectionLabel => {
    const improvement = value * preferenceType;
    return improvement > 0 ? "↑" : improvement < 0 ? "↓" : "=";
  });
  const scores = matrix[matrix.length - 1].map((value, i) => value + variability[i] * direction[i]);
  finiteVector(scores, count, "DARIA scores");
  return { scores, variability, direction, directionLabels };
}
