export type CradisDebugResults = {
  normalizedMatrix: number[][];
  weightedMatrix: number[][];
  positiveDistances: number[];
  negativeDistances: number[];
  optimalPositiveDistance: number;
  optimalNegativeDistance: number;
  positiveUtilities: number[];
  negativeUtilities: number[];
  scores: number[];
};
