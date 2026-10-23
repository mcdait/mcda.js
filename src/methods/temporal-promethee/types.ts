import type { DecisionMatrix, Scores } from "../../types";
import type { DariaResult } from "../daria/types";

export type TemporalPrometheeResult = DariaResult & {
  /** Rows are periods in input order; columns are alternatives. */
  netFlows: DecisionMatrix;
};
export type TemporalPrometheeDebugResults = TemporalPrometheeResult & { latestScores: Scores };
