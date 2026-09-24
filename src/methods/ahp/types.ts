import type { DecisionMatrix } from "../../types";

/** One square alternative comparison matrix per criterion. */
export type AhpMatrix = DecisionMatrix[];

export type AhpPriorityMethod = (matrix: DecisionMatrix) => number[];
export type AhpConsistency = {
  lambdaMax: number;
  consistencyIndex: number;
  consistencyRatio: number | undefined;
  consistent: boolean | undefined;
};
export type AhpDebugResults = {
  priorities: number[][];
  consistency: AhpConsistency[];
  scores: number[];
};
