import { CriterionType, rank, TopsisDecisionProblem, vectorNormalizationCallback } from "mcdajs";
import { printMatrixComparison, printVectorComparison } from "./comparisonTables";

/**
 * Fighter aircraft selection problem
 *
 * Four anonymous aircraft (A1-A4) are compared using six criteria:
 * maximum speed (X1, Mach), ferry range (X2, nautical miles), maximum
 * payload (X3, pounds), purchase cost (X4, millions of dollars),
 * reliability (X5), and maneuverability (X6). Reliability and
 * maneuverability were originally qualitative ratings converted to numbers.
 * Purchase cost is the only cost criterion; all other criteria are benefits.
 *
 * TOPSIS ranks each aircraft by its relative closeness to the ideal solution:
 * a preferred aircraft should be near the best attainable criterion values
 * and far from the worst attainable values.
 *
 * Source:
 * Hwang, C.-L., & Yoon, K. (1981). Multiple Attribute Decision Making:
 * Methods and Applications: A State-of-the-Art Survey. Springer-Verlag,
 * pp. 133-134.
 * https://doi.org/10.1007/978-3-642-48318-9
 */
type TopsisDebugResults = {
  normalizedMatrix: number[][];
  weightedNormalizedMatrix: number[][];
  idealBest: number[];
  idealWorst: number[];
  distanceToBest: number[];
  distanceToWorst: number[];
};

const pdfResults = {
  normalizedMatrix: [
    [0.4671, 0.3662, 0.5056, 0.5063, 0.4811, 0.6708],
    [0.5839, 0.6591, 0.455, 0.5983, 0.2887, 0.3727],
    [0.4204, 0.4882, 0.5308, 0.4143, 0.6736, 0.5217],
    [0.5139, 0.4392, 0.5056, 0.4603, 0.4811, 0.3727],
  ],
  weightedNormalizedMatrix: [
    [0.0934, 0.0366, 0.0506, 0.0506, 0.0962, 0.2012],
    [0.1168, 0.0659, 0.0455, 0.0598, 0.0577, 0.1118],
    [0.0841, 0.0488, 0.0531, 0.0414, 0.1347, 0.1565],
    [0.1028, 0.0439, 0.0506, 0.046, 0.0962, 0.1118],
  ],
  idealBest: [0.1168, 0.0659, 0.0531, 0.0414, 0.1347, 0.2012],
  idealWorst: [0.0841, 0.0366, 0.0455, 0.0598, 0.0577, 0.1118],
  distanceToBest: [0.0545, 0.1197, 0.058, 0.1009],
  distanceToWorst: [0.0983, 0.0439, 0.092, 0.0458],
  scores: [0.643, 0.268, 0.613, 0.312],
  ranks: [1, 4, 2, 3],
};

const problem = new TopsisDecisionProblem();

problem.alternatives = ["A1", "A2", "A3", "A4"];
problem.criteria = ["X1", "X2", "X3", "X4", "X5", "X6"];
problem.matrix = [
  [2.0, 1500, 20000, 5.5, 5, 9],
  [2.5, 2700, 18000, 6.5, 3, 5],
  [1.8, 2000, 21000, 4.5, 7, 7],
  [2.2, 1800, 20000, 5.0, 5, 5],
];
problem.weights = [0.2, 0.1, 0.1, 0.1, 0.2, 0.3];
problem.types = [
  CriterionType.BENEFIT,
  CriterionType.BENEFIT,
  CriterionType.BENEFIT,
  CriterionType.COST,
  CriterionType.BENEFIT,
  CriterionType.BENEFIT,
];
problem.normalizationCallback = vectorNormalizationCallback;
problem.enableDebug(true);

const scores = problem.scores;
const ranks = rank(scores);
const debugResults = problem.debugBag as TopsisDebugResults;
const ranking = problem.alternatives
  .map((alternative, index) => ({
    alternative,
    score: scores[index] ?? 0,
    rank: ranks[index] ?? 0,
  }))
  .sort((first, second) => first.rank - second.rank);

printMatrixComparison(
  "Normalized decision matrix",
  problem.alternatives,
  problem.criteria,
  debugResults.normalizedMatrix,
  pdfResults.normalizedMatrix,
  4,
  "alternative",
);
printMatrixComparison(
  "Weighted normalized decision matrix",
  problem.alternatives,
  problem.criteria,
  debugResults.weightedNormalizedMatrix,
  pdfResults.weightedNormalizedMatrix,
  4,
  "alternative",
);
printVectorComparison("Ideal best", problem.criteria, debugResults.idealBest, pdfResults.idealBest);
printVectorComparison(
  "Ideal worst",
  problem.criteria,
  debugResults.idealWorst,
  pdfResults.idealWorst,
);
printVectorComparison(
  "Distance to ideal best",
  problem.alternatives,
  debugResults.distanceToBest,
  pdfResults.distanceToBest,
);
printVectorComparison(
  "Distance to ideal worst",
  problem.alternatives,
  debugResults.distanceToWorst,
  pdfResults.distanceToWorst,
);
printVectorComparison(
  "Relative closeness scores",
  problem.alternatives,
  scores,
  pdfResults.scores,
  3,
);

console.log("Ranking");
console.table(
  ranking.map((result) => {
    const alternativeIndex = problem.alternatives.indexOf(result.alternative);

    return {
      ...result,
      pdfScore: pdfResults.scores[alternativeIndex],
      pdfRank: pdfResults.ranks[alternativeIndex],
      rankDifference: result.rank - (pdfResults.ranks[alternativeIndex] ?? 0),
    };
  }),
);
console.log(`Ranking: ${ranking.map(({ alternative }) => alternative).join(" > ")}`);
