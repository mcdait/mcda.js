import { describe, expect, it } from "@jest/globals";
import { EdasDecisionProblem } from "../../../src/methods/edas";
import type { EdasDebugResults } from "../../../src/methods/edas";
import { CriterionType } from "../../../src/types";
import type { DecisionMatrix } from "../../../src/types";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

function createEdasProblem(): EdasDecisionProblem {
  const problem = new EdasDecisionProblem();

  problem.alternatives = alternatives;
  problem.criteria = criteria;
  problem.matrix = matrix;
  problem.weights = weights;
  problem.types = types;

  return problem;
}

describe("EdasDecisionProblem", () => {
  it("calculates appraisal scores", () => {
    const problem = createEdasProblem();
    const roundedScores = problem.scores.map((score) => Math.round(score * 10000) / 10000);

    expect(roundedScores).toEqual([0.4245, 0.7626, 0.2063]);
  });

  it("handles alternatives with no positive or negative distances", () => {
    const problem = new EdasDecisionProblem();

    problem.matrix = [
      [1, 2],
      [1, 2],
    ];
    problem.weights = [0.5, 0.5];
    problem.types = [CriterionType.BENEFIT, CriterionType.COST];

    expect(problem.scores).toEqual([0.5, 0.5]);
  });

  it("rejects a zero average solution", () => {
    const problem = createEdasProblem();
    problem.matrix = [
      [-1, 7, 1200],
      [0, 9, 1000],
      [1, 6, 1400],
    ];

    expect(() => problem.scores).toThrow(
      "EDAS average solution for criterion at index 0 must not be zero.",
    );
  });

  it("optionally provides debug results", () => {
    const problem = createEdasProblem();
    problem.enableDebug(true);

    const scores = problem.scores;
    const debugBag = problem.debugBag as EdasDebugResults | undefined;

    expect(debugBag).toBeDefined();
    expect(debugBag?.averageSolution).toEqual([8, 22 / 3, 1200]);
    expect(debugBag?.appraisalScores).toEqual(scores);
  });
});
