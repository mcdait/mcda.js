import { describe, expect, test } from "@jest/globals";
import { CriterionType } from "../../../src/types";
import {
  linearPreference,
  PrometheeDecisionProblem,
  usualPreference,
} from "../../../src/methods/promethee";
import { PreferenceFunction } from "../../../src/methods/promethee/types";

function createPrometheeProblem(): PrometheeDecisionProblem {
  const problem = new PrometheeDecisionProblem();

  problem.alternatives = ["A", "B", "C"];
  problem.criteria = ["Quality", "Cost"];
  problem.matrix = [
    [10, 5],
    [8, 7],
    [6, 4],
  ];
  problem.weights = [0.6, 0.4];
  problem.types = [CriterionType.BENEFIT, CriterionType.COST];
  problem.preferenceFunctions = [linearPreference(4, 1), usualPreference];

  return problem;
}

describe("PrometheeDecisionProblem", () => {
  test("calculates scores with one preference function per criterion", () => {
    const problem = createPrometheeProblem();

    expect(problem.scores[0]).toBeCloseTo(0.4);
    expect(problem.scores[1]).toBeCloseTo(-0.4);
    expect(problem.scores[2]).toBeCloseTo(0);
  });

  test("accepts a custom preference function", () => {
    const problem = new PrometheeDecisionProblem();
    const customPreference: PreferenceFunction = (difference) => {
      if (difference <= 0) {
        return 0;
      }

      return Math.min(difference / 4, 1);
    };

    problem.matrix = [[3], [1]];
    problem.weights = [1];
    problem.types = [CriterionType.BENEFIT];
    problem.preferenceFunctions = [customPreference];

    expect(problem.scores[0]).toBeCloseTo(0.5);
    expect(problem.scores[1]).toBeCloseTo(-0.5);
  });

  test("requires one preference function per weight", () => {
    const problem = createPrometheeProblem();

    problem.preferenceFunctions = [usualPreference];

    expect(() => problem.scores).toThrow("PROMETHEE requires one preference function per weight.");
  });

  test("requires preference functions to be callable", () => {
    const problem = createPrometheeProblem();

    problem.preferenceFunctions = [usualPreference, undefined as unknown as PreferenceFunction];

    expect(() => problem.scores).toThrow("PROMETHEE preference functions must be callable.");
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1])(
    "rejects invalid preference result %s",
    (preferenceResult) => {
      const problem = createPrometheeProblem();
      const invalidPreference = () => preferenceResult;

      problem.preferenceFunctions = [invalidPreference, usualPreference];

      expect(() => problem.scores).toThrow(
        "PROMETHEE preference function must return a finite number between 0 and 1.",
      );
    },
  );
});
