import { describe, expect, it } from "@jest/globals";
import { rank } from "../../src";

describe("rank", () => {
  it.each([
    { scores: [], descending: [], ascending: [] },
    { scores: [7], descending: [1], ascending: [1] },
    { scores: [4, 4, 1, 2], descending: [1, 1, 3, 2], ascending: [3, 3, 1, 2] },
    { scores: [-3, 0, -1], descending: [3, 1, 2], ascending: [1, 3, 2] },
    { scores: [2, 2, 2], descending: [1, 1, 1], ascending: [1, 1, 1] },
  ])("assigns dense ranks without reordering $scores", ({ scores, descending, ascending }) => {
    const input = Object.freeze([...scores]);
    expect(rank(input)).toEqual(descending);
    expect(rank(input, false)).toEqual(ascending);
    expect(input).toEqual(scores);
  });

  it("does not round distinct scores into ties", () => {
    expect(rank([1, 1 + Number.EPSILON, 1])).toEqual([2, 1, 2]);
  });
});
