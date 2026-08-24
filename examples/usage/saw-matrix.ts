import {
  CriterionType,
  DecisionMatrix,
  minMaxNormalizationCallback,
  rank,
  SawDecisionProblem,
  Scores,
} from "mcdajs";

const matrix: DecisionMatrix = [
  // [C1, C2]
  [8, 1200], // A1
  [7, 1000], // A2
  [9, 1400], // A3
  [6, 1100], // A4
];

const problem = new SawDecisionProblem();
problem.matrix = matrix;
problem.criteria = ["C1", "C2"];
problem.alternatives = ["A1", "A2", "A3", "A4"];
problem.weights = [0.5, 0.5];
problem.types = [CriterionType.BENEFIT, CriterionType.COST];
problem.normalizationCallback = minMaxNormalizationCallback;

const scores: Scores = problem.scores;
console.log(scores);
const ranks = rank(scores);
console.log(ranks);
