import { describe, expect, it } from "@jest/globals";
import {
  AhpDecisionProblem,
  type AhpDebugResults,
  eigenvectorPriority,
  geometricMeanPriority,
  normalizedRowSumPriority,
} from "../../../src";

function getConsistency(matrix: number[][]) {
  const problem = new AhpDecisionProblem();
  problem.matrix = [matrix];
  problem.weights = [1];
  problem.enableDebug(true);
  problem.scores;
  return (problem.debugBag as AhpDebugResults).consistency[0];
}

const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(): AhpDecisionProblem {
  const problem = new AhpDecisionProblem();
  problem.matrix = [
    [
      [1, 3, 5],
      [1 / 3, 1, 2],
      [1 / 5, 1 / 2, 1],
    ],
    [
      [1, 1 / 4, 1 / 2],
      [4, 1, 3],
      [2, 1 / 3, 1],
    ],
  ];
  problem.weights = [0.6, 0.4];
  return problem;
}
describe("AhpDecisionProblem", () => {
  it("calculates priorities and scores using the principal eigenvector", () => {
    const problem = createProblem();
    problem.priorityMethod = eigenvectorPriority;
    expect(rounded(eigenvectorPriority(problem.matrix[0]))).toEqual([0.6483, 0.2297, 0.122]);
    expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
  });
  it("calculates priorities and scores using normalized row sums", () => {
    const problem = createProblem();
    problem.priorityMethod = normalizedRowSumPriority;
    expect(rounded(normalizedRowSumPriority(problem.matrix[0]))).toEqual([0.6413, 0.2375, 0.1211]);
    expect(rounded(problem.scores)).toEqual([0.4383, 0.3871, 0.1746]);
  });
  it("calculates priorities and scores using geometric means", () => {
    const problem = createProblem();
    problem.priorityMethod = geometricMeanPriority;
    expect(rounded(geometricMeanPriority(problem.matrix[0]))).toEqual([0.6483, 0.2297, 0.122]);
    expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
  });
  it("calculates consistency statistics for pairwise comparisons", () => {
    const stats = getConsistency(createProblem().matrix[0]);
    expect(rounded([stats.lambdaMax, stats.consistencyIndex, stats.consistencyRatio!])).toEqual([
      3.0037, 0.0018, 0.0032,
    ]);
    expect(stats.consistent).toBe(true);
  });
  it("handles two alternatives and larger consistent matrices", () => {
    expect(
      rounded(
        eigenvectorPriority([
          [1, 2],
          [0.5, 1],
        ]),
      ),
    ).toEqual([0.6667, 0.3333]);
    expect(
      getConsistency([
        [1, 2],
        [0.5, 1],
      ]).consistencyRatio,
    ).toBe(0);
    const priorities = [1, 2, 3, 4];
    const matrix = priorities.map((x) => priorities.map((y) => x / y));
    expect(rounded(eigenvectorPriority(matrix))).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(getConsistency(matrix).consistencyRatio).toBeCloseTo(0, 10);
  });
  it("returns undefined consistency ratio beyond its RI table", () => {
    expect(
      getConsistency(Array.from({ length: 11 }, () => Array(11).fill(1))).consistencyRatio,
    ).toBeUndefined();
  });
  it("reports failure to converge", () => {
    expect(() => eigenvectorPriority(createProblem().matrix[0], 1e-15, 1)).toThrow(/converge/);
  });
  it("rejects invalid matrices, weights and callback priorities", () => {
    const problem = createProblem();
    problem.matrix[0][0][0] = 2;
    expect(() => problem.scores).toThrow(/diagonal/);
    const nonReciprocal = createProblem();
    nonReciprocal.matrix[0][0][1] = 4;
    expect(() => nonReciprocal.scores).toThrow(/reciprocal/);
    const other = createProblem();
    other.weights = [1];
    expect(() => other.scores).toThrow();
    other.weights = [0.6, 0.4];
    other.priorityMethod = () => [1, 1, 1];
    expect(() => other.scores).toThrow(/sum to 1/);
  });
  it("supports recomputation and optional debug without mutating the matrices", () => {
    const problem = createProblem();
    const original = JSON.stringify(problem.matrix);
    const scores = problem.scores;
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    expect(problem.scores).toEqual(scores);
    expect(problem.debugBag?.scores).toEqual(scores);
    expect(problem.debugBag?.consistency).toHaveLength(2);
    expect(JSON.stringify(problem.matrix)).toBe(original);
    problem.weights = [0.4, 0.6];
    expect(problem.scores).not.toEqual(scores);
    problem.enableDebug(false);
    problem.scores;
    expect(problem.debugBag).toBeUndefined();
  });
});

it("distinguishes eigenvector and geometric mean priorities for inconsistent comparisons", () => {
  const matrix = [
    [1, 3, 5, 7],
    [1 / 3, 1, 2, 4],
    [1 / 5, 1 / 2, 1, 3],
    [1 / 7, 1 / 4, 1 / 3, 1],
  ];
  expect(rounded(eigenvectorPriority(matrix))).toEqual([0.5781, 0.2282, 0.1336, 0.06]);
  expect(rounded(geometricMeanPriority(matrix))).toEqual([0.5768, 0.2303, 0.1334, 0.0595]);
});

it("uses the default priority method with the standard problem properties", () => {
  const problem = new AhpDecisionProblem();
  problem.alternatives = ["A", "B"];
  problem.criteria = ["Price", "Comfort"];
  problem.weights = [0.6, 0.4];
  problem.matrix = [
    [
      [1, 3],
      [1 / 3, 1],
    ],
    [
      [1, 1 / 2],
      [2, 1],
    ],
  ];
  expect(rounded(problem.scores)).toEqual([0.5833, 0.4167]);
  expect(problem.alternatives).toEqual(["A", "B"]);
  expect(problem.criteria).toEqual(["Price", "Comfort"]);
});

it("accepts weights calculated from comparisons of criteria", () => {
  const problem = createProblem();
  problem.weights = eigenvectorPriority([
    [1, 1.5],
    [1 / 1.5, 1],
  ]);
  expect(rounded(problem.weights)).toEqual([0.6, 0.4]);
  expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
});

it("validates optional alternative and criterion names", () => {
  const problem = createProblem();
  problem.alternatives = ["A"];
  expect(() => problem.scores).toThrow(/alternative name/);
  problem.alternatives = ["A", "B", " "];
  expect(() => problem.scores).toThrow(/alternative name/);
  problem.alternatives = [];
  problem.criteria = ["Price"];
  expect(() => problem.scores).toThrow(/criterion name/);
  problem.criteria = ["Price", ""];
  expect(() => problem.scores).toThrow(/criterion name/);
  problem.criteria = [];
  expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
});

it("requires equally sized square matrices and one weight per criterion", () => {
  const problem = createProblem();
  problem.matrix = [];
  expect(() => problem.scores).toThrow();
  problem.matrix = [
    [
      [1, 2],
      [0.5, 1],
    ],
    [[1]],
  ];
  expect(() => problem.scores).toThrow();
  problem.matrix = [[[1, 2], [0.5]]];
  problem.weights = [1];
  expect(() => problem.scores).toThrow();
  problem.matrix = [
    [
      [1, 2],
      [0.5, 1],
    ],
  ];
  problem.weights = [0.5, 0.5];
  expect(() => problem.scores).toThrow();
});

it("reports inconsistent comparisons through debug without blocking scores", () => {
  const problem = new AhpDecisionProblem();
  problem.matrix = [
    [
      [1, 9, 1 / 9],
      [1 / 9, 1, 9],
      [9, 1 / 9, 1],
    ],
  ];
  problem.weights = [1];
  problem.enableDebug(true);
  expect(rounded(problem.scores)).toEqual([0.3333, 0.3333, 0.3333]);
  const statistics = (problem.debugBag as AhpDebugResults).consistency[0];
  expect(statistics.consistent).toBe(false);
  expect(statistics.consistencyRatio).toBeGreaterThan(0.1);
  problem.priorityMethod = geometricMeanPriority;
  problem.scores;
  expect((problem.debugBag as AhpDebugResults).consistency[0]).toEqual(statistics);
});
