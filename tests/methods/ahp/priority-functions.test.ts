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
      for (const matrix of [
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
      ]) {
        expect(() => calculatePriority(matrix)).toThrow();
      }
    });

    it("calculates normalized priorities without changing the matrix", () => {
      const matrix = [
        [1, 3],
        [1 / 3, 1],
      ];
      const priorities = calculatePriority(matrix).map(
        (value) => Math.round(value * 10000) / 10000,
      );
      expect(priorities).toEqual([0.75, 0.25]);
      expect(matrix).toEqual([
        [1, 3],
        [1 / 3, 1],
      ]);
    });
  },
);
