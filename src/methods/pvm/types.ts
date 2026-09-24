export enum PvmCriterionType {
  STIMULANT = "m",
  DESTIMULANT = "dm",
  DESIRED = "d",
  UNDESIRED = "nd",
}
export type PvmDebugResults = {
  normalizedMatrix: number[][];
  psi: number[];
  phi: number[];
  normalizedPsi: number[];
  normalizedPhi: number[];
  direction: number[];
  vectorScores: number[];
  desiredDistances: number[];
  undesiredDistances: number[];
  scores: number[];
};
