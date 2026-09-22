export type VikorSmaaResult = {
  rankAcceptabilityIndex: number[][];
  centralWeightVectors: number[][];
  ranks: number[];
};
export type VikorSmaaDebugResults = VikorSmaaResult & {
  preferences: number[][];
  sampleRanks: number[][];
  rankScores: number[];
};
