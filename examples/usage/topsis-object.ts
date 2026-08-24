import {
  CriterionType,
  DecisionMatrixObject,
  minMaxNormalizationCallback,
  rank,
  Scores,
  TopsisDecisionProblem,
} from "mcdajs";

const matrixObj: DecisionMatrixObject = {
  A1: { C1: 8, C2: 1200 },
  A2: { C1: 7, C2: 1000 },
  A3: { C1: 9, C2: 1400 },
  A4: { C1: 6, C2: 1100 },
};

const problem = new TopsisDecisionProblem();
problem.matrixObj = matrixObj;
problem.weights = [0.5, 0.5];
problem.types = [CriterionType.BENEFIT, CriterionType.COST];
problem.normalizationCallback = minMaxNormalizationCallback;

const scores: Scores = problem.scores;
console.log(scores);
const ranks = rank(scores);
console.log(ranks);

problem.enableDebug(true);
problem.scores;
console.log(problem.debugBag);
