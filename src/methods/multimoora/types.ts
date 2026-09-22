/** Rows are alternatives; columns are RS, RP and FMF, in that order. */
export type CompromiseRankingCallback = (preferences: number[][], ranks: number[][]) => number[];
export type MultimooraComponentDebugResults = { normalizedMatrix: number[][]; scores: number[] };
export type MultimooraRsDebugResults = MultimooraComponentDebugResults;
export type MultimooraRpDebugResults = MultimooraComponentDebugResults;
export type MultimooraFmfDebugResults = MultimooraComponentDebugResults;
export type MultimooraDebugResults = {
  preferences: number[][];
  componentRanks: number[][];
  ranks: number[];
};
