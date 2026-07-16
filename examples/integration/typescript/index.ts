import { CriterionType, rank, TopsisDecisionProblem, vectorNormalizationCallback } from "mcdajs";

const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("MATRIX", matrix);

const weights: number[] = [1 / 3, 1 / 3, 1 / 3];
console.log("WEIGHTS", weights);

const alternativeNames: string[] = ["A1", "A2", "A3"];
console.log("ALTERNATIVE NAMES", alternativeNames);

const criteriaNames: string[] = ["C1", "C2", "C3"];
console.log("CRITERIA NAMES", criteriaNames);

const types: CriterionType[] = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];
console.log("TYPES", types);

const problem: TopsisDecisionProblem = new TopsisDecisionProblem();

problem.matrix = matrix;
problem.weights = weights;
problem.types = types;

problem.alternatives = alternativeNames;
problem.criteria = criteriaNames;

problem.normalizationCallback = vectorNormalizationCallback;

const scores: number[] = problem.scores;
const ranks: number[] = rank(scores);

type RankingResult = {
  alternative: string;
  score: number;
  rank: number;
};

const result: RankingResult[] = problem.alternatives
  .map((alternative: string, i: number): RankingResult => ({
    alternative,
    score: scores[i]!,
    rank: ranks[i]!,
  }))
  .sort((a: RankingResult, b: RankingResult): number => a.rank - b.rank);

console.log("\nTOPSIS ranking");

for (const item of result) {
  console.log(`${item.rank}. ${item.alternative} (${item.score.toFixed(6)})`);
}
