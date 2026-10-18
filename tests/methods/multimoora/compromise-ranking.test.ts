import { describe, expect, it } from "@jest/globals";
import { copeland, dominanceDirectedGraph, rankPosition } from "../../../src";

describe("compromise ranking contracts", () => {
  it("preserves positional Copeland ties even with a majority winner", () => {
    const ranks = [
      [1, 1, 3],
      [2, 2, 1],
      [3, 3, 2],
    ];
    expect(copeland([], ranks)).toEqual([1, 1, 2]);
    expect(ranks).toEqual([
      [1, 1, 3],
      [2, 2, 1],
      [3, 3, 2],
    ]);
  });

  describe.each([copeland, dominanceDirectedGraph, rankPosition])("%p", (aggregate) => {
    it.each([
      { label: "zero", ranks: [[0], [1]] },
      { label: "fractional", ranks: [[1.5], [1]] },
      { label: "out of range", ranks: [[3], [1]] },
    ])("rejects $label ranks", ({ ranks }) => {
      expect(() => aggregate([], ranks)).toThrow(/integer ranks/);
    });
  });
});
