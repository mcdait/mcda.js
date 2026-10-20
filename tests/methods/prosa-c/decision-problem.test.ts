import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import {
  CriterionType,
  gaussianPreference,
  levelPreference,
  linearPreference,
  ProsaCDecisionProblem,
  uShapePreference,
  usualPreference,
  vShapePreference,
} from "../../../src";
import { rank } from "../../../src/utils/ranking";

function createProblem(second = false): ProsaCDecisionProblem {
  const problem = new ProsaCDecisionProblem();
  problem.matrix = second
    ? [
        [4, 9, 200, 3],
        [7, 6, 150, 8],
        [6, 8, 180, 5],
        [9, 5, 240, 7],
      ]
    : [
        [8, 7, 1200],
        [7, 9, 1000],
        [9, 6, 1400],
      ];
  problem.weights = second ? [0.25, 0.3, 0.2, 0.25] : [0.4, 0.35, 0.25];
  problem.types = second
    ? [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST, CriterionType.COST]
    : [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];
  problem.preferenceFunctions = problem.weights.map(() => usualPreference);
  return problem;
}

describe("ProsaCDecisionProblem", () => {
  it("calculates scores for three alternatives", () => {
    expect(round4(createProblem().scores)).toEqual([0, -0.088, -0.488]);
  });
  it("calculates scores with four criteria and unequal weights", () => {
    expect(round4(createProblem(true).scores)).toEqual([-0.0197, -0.2547, 0.0917, -0.5333]);
  });
  it("supports matrixObj, recalculation and optional debug without mutating inputs", () => {
    const problem = createProblem();
    const original = problem.matrix.map((row) => [...row]);
    problem.matrixObj = {
      A: { performance: 8, battery: 7, price: 1200 },
      B: { performance: 7, battery: 9, price: 1000 },
      C: { performance: 9, battery: 6, price: 1400 },
    };
    const initial = problem.scores;
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    expect(problem.scores).toEqual(initial);
    expect(problem.debugBag?.scores).toEqual(initial);
    expect(problem.matrix).toEqual(original);
    problem.weights = [0.2, 0.3, 0.5];
    const changed = problem.scores;
    const fresh = createProblem();
    fresh.weights = [...problem.weights];
    expect(changed).toEqual(fresh.scores);
    problem.enableDebug(false);
    problem.scores;
    expect(problem.debugBag).toBeUndefined();
  });
  it.each([
    {
      label: "empty matrix",
      matrix: [],
      weights: [0.4, 0.35, 0.25],
      error: "Decision problem requires at least one alternative.",
    },
    {
      label: "ragged row",
      matrix: [[1, 2]],
      weights: [0.4, 0.35, 0.25],
      error: "Decision problem matrix rows must match the weights length.",
    },
    {
      label: "NaN value",
      matrix: [[NaN, 2, 3]],
      weights: [0.4, 0.35, 0.25],
      error: "Matrix row must contain 3 finite values.",
    },
    {
      label: "negative weight",
      matrix: [[1, 2, 3]],
      weights: [-1, 1, 1],
      error: "Weights must be non-negative with a positive sum.",
    },
  ])("rejects $label", ({ matrix, weights, error }) => {
    const problem = createProblem();
    problem.matrix = matrix.map((row) => [...row]);
    problem.weights = [...weights];
    expect(() => problem.scores).toThrow(new Error(error));
  });
  it("calculates scores with usual preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return usualPreference;
    });
    expect(round4(problem.scores)).toEqual([0, -0.0316, -0.4316]);
  });
  it("calculates scores with U-shaped preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return uShapePreference(q);
    });
    expect(round4(problem.scores)).toEqual([-0.2362, -0.0316, -0.232]);
  });
  it("calculates scores with V-shaped preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return vShapePreference(p);
    });
    expect(round4(problem.scores)).toEqual([-0.0591, 0.0401, -0.2475]);
  });
  it("calculates scores with level preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return levelPreference(p, q);
    });
    expect(round4(problem.scores)).toEqual([-0.1181, -0.0158, -0.116]);
  });
  it("calculates scores with linear preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return linearPreference(p, q);
    });
    expect(round4(problem.scores)).toEqual([-0.0787, 0.0358, -0.1777]);
  });
  it("calculates scores with Gaussian preferences and custom sustainability coefficients", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return gaussianPreference(p, q);
    });
    expect(round4(problem.scores)).toEqual([-0.0465, 0.0281, -0.153]);
  });
  it("reduces to PROMETHEE net flows when s=0", () => {
    const problem = createProblem();
    problem.s = [0, 0, 0];
    expect(round4(problem.scores)).toEqual([0, 0.2, -0.2]);
  });
  it("rejects invalid s, preference functions and a single alternative", () => {
    const problem = createProblem();
    problem.s = [0.3];
    expect(() => problem.scores).toThrow(
      new Error("PROSA-C sustainability coefficients must contain 3 finite values."),
    );
    problem.s = undefined;
    problem.preferenceFunctions = [() => 2, () => 0, () => 0];
    expect(() => problem.scores).toThrow(
      new Error("Preference functions must return finite values between 0 and 1."),
    );
    problem.matrix = [problem.matrix[0]];
    expect(() => problem.scores).toThrow(new Error("PROSA-C requires at least two alternatives."));
  });
});

it("ranks three alternatives using unrounded scores", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([1, 2, 3]);
});

it("ranks alternatives with four criteria using unrounded scores", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([2, 3, 1, 4]);
});

it("rounds negative scores to four decimals at a halfway boundary", () => {
  const problem = createProblem();
  problem.s = [0.1, 0.3, 0.5];
  problem.preferenceFunctions = [0.5, 1, 100].map(uShapePreference);
  expect(round4(problem.scores)).toEqual([-0.238, -0.032, -0.2377]);
  expect(round4(problem.scores[2])).toBe(-0.2377);
});

it("exposes criterion flows and weighted sustainability penalties", () => {
  const problem = createProblem();
  problem.enableDebug(true);
  problem.scores;
  expect(problem.debugBag?.criterionFlows).toEqual([
    [0, 0, 0],
    [-1, 1, 1],
    [1, -1, -1],
  ]);
  expect(round4(problem.debugBag?.deviations as number[])).toEqual([0, 0.288, 0.288]);
});
