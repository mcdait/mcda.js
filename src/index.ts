import { PrometheeDecisionProblem } from "./core/PrometheeDecisionProblem";
import { TopsisDecisionProblem } from "./core/TopsisDecisionProblem";
import { CriterionType } from "./types";
import { vectorNormalizationCallback } from "./utils/normalization";

const alternatives = ["Laptop A", "Laptop B", "Laptop C"];

const problem = new TopsisDecisionProblem();

problem.enableDebug(true)

problem.matrix = [
    [8, 7, 1200],
    [7, 9, 1000],
    [9, 6, 1400],
];
problem.weights = [0.4, 0.35, 0.25];
problem.types = [
    CriterionType.BENEFIT,
    CriterionType.BENEFIT,
    CriterionType.COST,
];
problem.normalizationCallback = vectorNormalizationCallback;

const scores = problem.scores;
console.debug(scores)
const ranking = scores
    .map((score, index) => ({
        alternative: alternatives[index],
        score,
    }))
    .sort((left, right) => right.score - left.score);

console.log("TOPSIS scores:");

for (const result of ranking) {
    console.log(`${result.alternative}: ${result.score.toFixed(4)}`);
}

console.log('TOPSIS debug bag:');
console.debug(problem.debugBag)

// const prometheeProblem = new PrometheeDecisionProblem();
//
// prometheeProblem.matrix = problem.matrix;
// prometheeProblem.weights = problem.weights;
// prometheeProblem.types = problem.types;
// prometheeProblem.normalizationCallback = vectorNormalizationCallback;
//
// const prometheeScores = prometheeProblem.scores;
// const prometheeRanking = prometheeScores
//     .map((score, index) => ({
//         alternative: alternatives[index],
//         score,
//     }))
//     .sort((left, right) => right.score - left.score);
//
// console.log("PROMETHEE scores:");
//
// for (const result of prometheeRanking) {
//     console.log(`${result.alternative}: ${result.score.toFixed(4)}`);
// }
