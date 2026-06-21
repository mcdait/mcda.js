import { PrometheeDecisionProblem } from "./core/PrometheeDecisionProblem";
import { TopsisDecisionProblem } from "./core/TopsisDecisionProblem";
import { CriterionType } from "./types";
import { vectorNormalizationCallback } from "./utils/normalization";

const alternatives = ["Laptop A", "Laptop B", "Laptop C"];

const problem = new TopsisDecisionProblem();

problem.enableDebug(true)

problem.setMatrix([
    [8, 7, 1200],
    [7, 9, 1000],
    [9, 6, 1400],
]);
problem.setWeights([0.4, 0.35, 0.25]);
problem.setTypes([
    CriterionType.BENEFIT,
    CriterionType.BENEFIT,
    CriterionType.COST,
]);
problem.setNormalizationCallback(vectorNormalizationCallback);

const scores = problem.compute();
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
console.debug(problem.getDebugBag())

// const prometheeProblem = new PrometheeDecisionProblem();
//
// prometheeProblem.setMatrix(problem.getMatrix());
// prometheeProblem.setWeights(problem.getWeights());
// prometheeProblem.setTypes(problem.getTypes());
// prometheeProblem.setNormalizationCallback(vectorNormalizationCallback);
//
// const prometheeScores = prometheeProblem.compute();
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
