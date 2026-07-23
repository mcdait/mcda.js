import { DecisionMatrix } from "../../types";

export type SpotisDebugResults = {
  isp: number[];
  normalizedMatrix: DecisionMatrix;
  D: number[];
};
