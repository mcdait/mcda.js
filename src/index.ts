// Core
export * from "./core";

// Methods
export * from "./methods/promethee";
export * from "./methods/mabac";
export * from "./methods/topsis";
export * from "./methods/vikor";

// Common types
export * from "./types";

// Utilities
export * from "./utils";

// import { PrometheeDecisionProblem } from "./methods/promethee/PrometheeDecisionProblem";
// import { TopsisDecisionProblem } from "./methods/topsis/TopsisDecisionProblem";
// import { CriterionType } from "./types/index.js";
// import { vectorNormalizationCallback } from "./utils/normalization.js";
// import { usualPreference } from "./methods/promethee/prometheePreferenceFunctions";
// import { rank } from "./utils/ranking.js";
// const problem = new TopsisDecisionProblem();
//
// problem.enableDebug(true);
// problem.alternatives = ["Laptop A", "Laptop B", "Laptop C"];
// problem.criteria = ["Performance", "Battery", "Price"];
// problem.matrix = [
//   [8, 7, 1200],
//   [7, 9, 1000],
//   [9, 6, 1400],
// ];
// problem.weights = [0.4, 0.35, 0.25];
// problem.types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];
// problem.normalizationCallback = vectorNormalizationCallback;
//
// const scores = problem.scores;
// console.debug(scores);
// const ranks = rank(scores);
// const ranking = scores
//   .map((score, index) => ({
//     alternative: problem.alternatives[index],
//     rank: ranks[index],
//     score,
//   }))
//   .sort((left, right) => right.score - left.score);
//
// console.log("TOPSIS scores:");
//
// for (const result of ranking) {
//   console.log(`${result.alternative}: score=${result.score.toFixed(4)}, rank=${result.rank}`);
// }
//
// console.log("TOPSIS debug bag:");
// console.debug(problem.debugBag);
//
// const prometheeProblem = new PrometheeDecisionProblem();
//
// prometheeProblem.alternatives = ["A1", "A2", "A3", "A4"];
// prometheeProblem.criteria = ["C1", "C2", "C3"];
// prometheeProblem.matrix = [
//   [4, 4, 0.2],
//   [1, 5, 0.5],
//   [3, 2, 0.3],
//   [4, 3, 0.5],
// ];
// prometheeProblem.weights = [0.3, 0.5, 0.2];
// prometheeProblem.types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];
// prometheeProblem.preferenceFunctions = [usualPreference, usualPreference, usualPreference];
//
// const prometheeScores = prometheeProblem.scores;
// const prometheeRanks = rank(prometheeScores);
// const prometheeRanking = prometheeScores
//   .map((score, index) => ({
//     alternative: prometheeProblem.alternatives[index],
//     rank: prometheeRanks[index],
//     score,
//   }))
//   .sort((left, right) => right.score - left.score);
//
// console.log("PROMETHEE II scores:");
//
// for (const result of prometheeRanking) {
//   console.log(`${result.alternative}: score=${result.score}, rank=${result.rank}`);
// }
