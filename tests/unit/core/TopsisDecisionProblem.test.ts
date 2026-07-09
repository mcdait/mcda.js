import { describe, expect, test } from "@jest/globals";
import { TopsisDecisionProblem } from "../../../src/core/TopsisDecisionProblem.js";
import { CriterionType } from "../../../src/types/index.js";
import type { DecisionMatrix } from "../../../src/types/index.js";
import { vectorNormalizationCallback } from "../../../src/utils/normalization.js";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

function createTopsisProblem(): TopsisDecisionProblem {
  const problem = new TopsisDecisionProblem();

  problem.alternatives = alternatives;
  problem.criteria = criteria;
  problem.matrix = matrix;
  problem.weights = weights;
  problem.types = types;
  problem.normalizationCallback = vectorNormalizationCallback;

  return problem;
}

describe("TopsisDecisionProblem", () => {
  test("calculates scores", () => {
    const problem = createTopsisProblem();

    expect(problem.scores).toEqual([0.4118760178494926, 0.6217594689573571, 0.3782405310426429]);
  });

  test("requires normalization callback", () => {
    const problem = new TopsisDecisionProblem();

    problem.alternatives = alternatives;
    problem.criteria = criteria;
    problem.matrix = matrix;
    problem.weights = weights;
    problem.types = types;

    expect(() => problem.scores).toThrow("TOPSIS requires a normalization callback.");
  });
});
