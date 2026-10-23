import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import {
  eigenvectorPriority,
  geometricMeanPriority,
  normalizedRowSumPriority,
} from "../../../src/methods/ahp/priority-functions";

describe.each([eigenvectorPriority, geometricMeanPriority, normalizedRowSumPriority])(
  "%p",
  (calculatePriority) => {
    it("rejects empty, ragged, non-positive and non-finite matrices", () => {
      const expectedErrors = [
        "Matrix must have non-empty, matching dimensions.",
        "Matrix row must contain 2 finite values.",
        "Priority calculations require a positive matrix.",
        "Matrix row must contain 2 finite values.",
      ];
      for (const [caseIndex, matrix] of [
        [],
        [[1, 2], [1]],
        [
          [1, 0],
          [2, 1],
        ],
        [
          [1, Infinity],
          [1, 1],
        ],
      ].entries()) {
        expect(() => calculatePriority(matrix)).toThrow(new Error(expectedErrors[caseIndex]));
      }
    });

    it("calculates normalized priorities without changing the matrix", () => {
      const matrix = [
        [1, 3],
        [1 / 3, 1],
      ];
      expect(round4(calculatePriority(matrix))).toEqual([0.75, 0.25]);
      expect(matrix).toEqual([
        [1, 3],
        [1 / 3, 1],
      ]);
    });
  },
);

describe("priority methods on inconsistent pairwise comparisons", () => {
  it.each([
    {
      name: "eigenvector",
      calculate: eigenvectorPriority,
      expected: [0.5781, 0.2282, 0.1336, 0.06],
    },
    {
      name: "geometric mean",
      calculate: geometricMeanPriority,
      expected: [0.5768, 0.2303, 0.1334, 0.0595],
    },
    {
      name: "row sums",
      calculate: normalizedRowSumPriority,
      expected: [0.5376, 0.2464, 0.1579, 0.058],
    },
  ])("calculates distinct $name priorities", ({ calculate, expected }) => {
    const matrix = [
      [1, 3, 5, 7],
      [1 / 3, 1, 2, 4],
      [1 / 5, 1 / 2, 1, 3],
      [1 / 7, 1 / 4, 1 / 3, 1],
    ];
    expect(round4(calculate(matrix))).toEqual(round4(expected));
  });

  it.each([0, -1, NaN, Infinity])("rejects tolerance=%s", (tolerance) => {
    expect(() => eigenvectorPriority([[1]], tolerance)).toThrow(
      new Error("AHP iteration settings must be positive and finite."),
    );
  });

  it.each([0, -1, 1.5, NaN, Infinity])("rejects maxIterations=%s", (iterations) => {
    expect(() => eigenvectorPriority([[1]], 1e-12, iterations)).toThrow(
      new Error("AHP iteration settings must be positive and finite."),
    );
  });

  it.each([
    { calculate: eigenvectorPriority, error: "AHP eigenvector calculation overflowed." },
    { calculate: normalizedRowSumPriority, error: "AHP row sum overflowed." },
  ])("%p reports overflow", ({ calculate, error }) => {
    const matrix = Array.from({ length: 2 }, () => [Number.MAX_VALUE, Number.MAX_VALUE]);
    expect(() => calculate(matrix)).toThrow(new Error(error));
  });
});
