import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import {
  TemporalPrometheeDecisionProblem,
  PrometheeDecisionProblem,
  giniVariability,
  linearPreference,
  usualPreference,
  rank,
} from "../../../src";

function createProblem(): TemporalPrometheeDecisionProblem {
  const problem = new TemporalPrometheeDecisionProblem();
  problem.matrices = [
    [
      [8, 7, 1200],
      [7, 9, 1000],
      [9, 6, 1400],
    ],
    [
      [9, 8, 1100],
      [8, 7, 1200],
      [7, 9, 1000],
    ],
    [
      [10, 9, 1000],
      [8, 8, 1300],
      [6, 7, 1100],
    ],
  ];
  problem.weights = [0.4, 0.35, 0.25];
  problem.types = [1, 1, -1];
  return problem;
}

describe("TemporalPrometheeDecisionProblem", () => {
  it("calculates default flows, variability and corrected scores", () => {
    const result = createProblem().result;
    [
      [0, 0.2, -0.2],
      [0.4, -0.6, 0.2],
      [1, -0.25, -0.75],
    ].forEach((row, i) => expect(round4(result.netFlows[i])).toEqual(round4(row)));
    expect(round4(result.variability)).toEqual([0.411, 0.3274, 0.3894]);
    expect(round4(result.scores)).toEqual([1.411, -0.5774, -1.1394]);
    expect(result.direction).toEqual([1, -1, -1]);
    expect(rank(result.scores)).toEqual([1, 2, 3]);
  });
  it("calculates signed Gini corrections", () => {
    const problem = createProblem();
    problem.variabilityCallback = giniVariability;
    expect(round4(problem.result.variability)).toEqual([0.4762, -0.8205, -0.8444]);
    expect(round4(problem.scores)).toEqual([1.4762, 0.5705, 0.0944]);
  });
  it("calculates flows and corrected scores with linear preference functions", () => {
    const problem = createProblem();
    problem.preferenceFunctions = [
      linearPreference(4, 0.5),
      linearPreference(4, 0.5),
      linearPreference(500, 100),
    ];
    expect(round4(problem.scores)).toEqual([0.6555, -0.2469, -0.5061]);
    expect(round4(problem.result.variability)).toEqual([0.2073, 0.1531, 0.1517]);
    expect(problem.result.direction).toEqual([1, -1, -1]);
    const flows = [
      [-0.05, 0.2107, -0.1607],
      [0.1143, -0.1312, 0.017],
      [0.4482, -0.0937, -0.3545],
    ];
    flows.forEach((row, i) => expect(round4(problem.result.netFlows[i])).toEqual(round4(row)));
  });
  it("reduces to existing PROMETHEE for one period and preserves input order", () => {
    const problem = createProblem();
    const classic = new PrometheeDecisionProblem();
    classic.matrix = problem.matrices[0];
    classic.weights = problem.weights;
    classic.types = problem.types;
    classic.preferenceFunctions = problem.weights.map(() => usualPreference);
    problem.matrices = [problem.matrices[0]];
    expect(problem.scores).toEqual(classic.scores);
    problem.matrices = [classic.matrix, classic.matrix];
    expect(problem.scores).toEqual(classic.scores);
    const reverse = createProblem();
    reverse.matrices.reverse();
    expect(reverse.result.direction).toEqual([-1, 1, 1]);
    expect(round4(reverse.scores)).toEqual([-0.411, 0.5274, 0.1894]);
  });
  it("supports names, recomputation, diagnostics and callback isolation", () => {
    const problem = createProblem();
    problem.alternatives = ["A", "B", "C"];
    problem.criteria = ["X", "Y", "Z"];
    const original = JSON.parse(JSON.stringify(problem.matrices));
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    const result = problem.result;
    expect(problem.debugBag).toEqual({ ...result, latestScores: result.netFlows[2] });
    problem.variabilityCallback = (matrix) => {
      matrix[2][0] = 999;
      return [0, 0, 0];
    };
    expect(problem.scores).toEqual(result.netFlows[2]);
    expect(problem.matrices).toEqual(original);
    problem.variabilityCallback = undefined;
    expect(problem.scores).toEqual(result.scores);
    problem.enableDebug(false);
    expect(problem.debugBag).toBeUndefined();
  });
  it("rejects empty, ragged, mismatched and non-finite periods", () => {
    const problem = createProblem();
    for (const matrices of [
      [],
      [[]],
      [[[1, 2, 3]]],
      [
        problem.matrices[0],
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
      [
        [
          [1, 2],
          [3, 4],
        ],
      ],
      [
        [
          [NaN, 2, 3],
          [4, 5, 6],
        ],
      ],
    ]) {
      problem.matrices = matrices;
      expect(() => problem.scores).toThrow();
    }
  });
  it("rejects invalid weights, types, names and callbacks", () => {
    const problem = createProblem();
    problem.weights = [-0.4, 0.35, 0.25];
    expect(() => problem.result).toThrow();
    problem.weights = [0.4, 0.35, 0.25];
    problem.types = [1, 1];
    expect(() => problem.result).toThrow();
    problem.types = [1, 1, -1];
    problem.alternatives = ["A"];
    expect(() => problem.result).toThrow(/alternative/);
    problem.alternatives = [];
    problem.preferenceFunctions = [usualPreference];
    expect(() => problem.result).toThrow(/preference function/);
    problem.preferenceFunctions = [() => NaN, usualPreference, usualPreference];
    expect(() => problem.result).toThrow(/finite/);
    problem.preferenceFunctions = [];
    problem.variabilityCallback = () => [Infinity, 0, 0];
    expect(() => problem.result).toThrow(/finite/);
  });
});
