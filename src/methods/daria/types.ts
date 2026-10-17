import type { DecisionMatrix, Scores } from "../../types";

/** Rows are consecutive periods; columns are alternatives. */
export type VariabilityCallback = (preferences: DecisionMatrix) => number[];
export type DariaDirection = -1 | 0 | 1;
export type DariaDirectionLabel = "↑" | "↓" | "=";
export type DariaResult = {
  scores: Scores;
  variability: number[];
  /** Raw score direction, independent of whether higher or lower is better. */
  direction: DariaDirection[];
  directionLabels: DariaDirectionLabel[];
};
export type DariaDebugResults = DariaResult & { latestScores: Scores };
