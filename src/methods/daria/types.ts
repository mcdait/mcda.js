import type { Scores } from "../../types";

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
