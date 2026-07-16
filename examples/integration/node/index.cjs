const {
  CriterionType,
  rank,
  TopsisDecisionProblem,
  vectorNormalizationCallback,
} = require("mcdajs");

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("MATRIX", matrix);

const weights = [1 / 3, 1 / 3, 1 / 3];
console.log("WEIGHTS", weights);

const alternativeNames = ["A1", "A2", "A3"];
console.log("ALTERNATIVE NAMES", alternativeNames);

const criteriaNames = ["C1", "C2", "C3"];
console.log("CRITERIA NAMES", criteriaNames);

const types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];
console.log("TYPES", types);

const problem = new TopsisDecisionProblem();

problem.matrix = matrix;
problem.weights = weights;
problem.types = types;

problem.alternatives = alternativeNames;
problem.criteria = criteriaNames;

problem.normalizationCallback = vectorNormalizationCallback;

const scores = problem.scores;
const ranks = rank(scores);

const result = problem.alternatives
  .map((alternative, i) => ({
    alternative,
    score: scores[i],
    rank: ranks[i],
  }))
  .sort((a, b) => a.rank - b.rank);

console.log("\nTOPSIS ranking");

for (const item of result) {
  console.log(`${item.rank}. ${item.alternative} (${item.score.toFixed(6)})`);
}
