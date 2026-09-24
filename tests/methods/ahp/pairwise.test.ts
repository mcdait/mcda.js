import { describe, expect, it } from "@jest/globals";
import {
  AhpPairwiseDecisionProblem,
  ahpConsistency,
  ahpEigenvector,
  ahpGeometricMean,
  ahpNormalizedColumnSum,
} from "../../../src";

const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(): AhpPairwiseDecisionProblem {
  const problem = new AhpPairwiseDecisionProblem();
  problem.alternativeMatrices = [
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
describe("Classic AHP", () => {
  it("calculates priorities and scores using the principal eigenvector", () => {
    const problem = createProblem();
    problem.priorityMethod = ahpEigenvector;
    expect(rounded(ahpEigenvector(problem.alternativeMatrices[0]))).toEqual([
      0.6483, 0.2297, 0.122,
    ]);
    expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
  });
  it("calculates priorities and scores using normalized row sums", () => {
    const problem = createProblem();
    problem.priorityMethod = ahpNormalizedColumnSum;
    expect(rounded(ahpNormalizedColumnSum(problem.alternativeMatrices[0]))).toEqual([
      0.6413, 0.2375, 0.1211,
    ]);
    expect(rounded(problem.scores)).toEqual([0.4383, 0.3871, 0.1746]);
  });
  it("calculates priorities and scores using geometric means", () => {
    const problem = createProblem();
    problem.priorityMethod = ahpGeometricMean;
    expect(rounded(ahpGeometricMean(problem.alternativeMatrices[0]))).toEqual([
      0.6483, 0.2297, 0.122,
    ]);
    expect(rounded(problem.scores)).toEqual([0.4436, 0.3878, 0.1686]);
  });
  it("calculates consistency statistics for pairwise comparisons", () => {
    const stats = ahpConsistency(createProblem().alternativeMatrices[0]);
    expect(rounded([stats.lambdaMax, stats.consistencyIndex, stats.consistencyRatio!])).toEqual([
      3.0037, 0.0018, 0.0032,
    ]);
    expect(stats.consistent).toBe(true);
  });
  it("handles two alternatives and larger consistent matrices", () => {
    expect(
      rounded(
        ahpEigenvector([
          [1, 2],
          [0.5, 1],
        ]),
      ),
    ).toEqual([0.6667, 0.3333]);
    expect(
      ahpConsistency([
        [1, 2],
        [0.5, 1],
      ]).consistencyRatio,
    ).toBe(0);
    const priorities = [1, 2, 3, 4];
    const matrix = priorities.map((x) => priorities.map((y) => x / y));
    expect(rounded(ahpEigenvector(matrix))).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(ahpConsistency(matrix).consistencyRatio).toBeCloseTo(0, 10);
  });
  it("returns undefined consistency ratio beyond its RI table", () => {
    expect(
      ahpConsistency(Array.from({ length: 11 }, () => Array(11).fill(1))).consistencyRatio,
    ).toBeUndefined();
  });
  it("reports failure to converge", () => {
    expect(() => ahpEigenvector(createProblem().alternativeMatrices[0], 1e-15, 1)).toThrow(
      /converge/,
    );
  });
  it("rejects invalid matrices, weights and callback priorities", () => {
    const problem = createProblem();
    problem.alternativeMatrices[0][0][0] = 2;
    expect(() => problem.scores).toThrow(/diagonal/);
    expect(() =>
      ahpEigenvector([
        [1, 2],
        [1, 1],
      ]),
    ).toThrow(/reciprocal/);
    const other = createProblem();
    other.weights = [1];
    expect(() => other.scores).toThrow();
    other.weights = [0.6, 0.4];
    other.priorityMethod = () => [1, 1, 1];
    expect(() => other.scores).toThrow(/sum to 1/);
  });
  it("supports recomputation and optional debug without mutating the matrices", () => {
    const problem = createProblem();
    const original = JSON.stringify(problem.alternativeMatrices);
    const scores = problem.scores;
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    expect(problem.scores).toEqual(scores);
    expect(problem.debugBag?.scores).toEqual(scores);
    expect(problem.debugBag?.consistency).toHaveLength(2);
    expect(JSON.stringify(problem.alternativeMatrices)).toBe(original);
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
  expect(rounded(ahpEigenvector(matrix))).toEqual([0.5781, 0.2282, 0.1336, 0.06]);
  expect(rounded(ahpGeometricMean(matrix))).toEqual([0.5768, 0.2303, 0.1334, 0.0595]);
});
