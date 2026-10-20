import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import {
  CriterionType,
  DariaAnalysis,
  standardDeviationVariability,
  varianceVariability,
  giniVariability,
  entropyVariability,
  coefficientOfVariationVariability,
} from "../../../src";

const preferences = [
  [0.2, -0.8, 0.3, -0.2],
  [0.5, -0.4, 0.3, 0],
  [0.8, -0.6, 0.3, 0.2],
];

describe("DariaAnalysis", () => {
  it.each([
    [standardDeviationVariability, [0.2449, 0.1633, 0, 0.1633], [1.0449, -0.4367, 0.3, 0.3633]],
    [varianceVariability, [0.06, 0.0267, 0, 0.0267], [0.86, -0.5733, 0.3, 0.2267]],
    [giniVariability, [0.2667, -0.1481, 0, 0.2667], [1.0667, -0.7481, 0.3, 0.4667]],
  ] as const)(
    "calculates variability and corrected scores (%#)",
    (callback, variability, scores) => {
      const analysis = new DariaAnalysis();
      analysis.matrix = preferences;
      analysis.variabilityCallback = callback;
      expect(round4(analysis.result.variability)).toEqual(round4([...variability]));
      expect(round4(analysis.scores)).toEqual(round4([...scores]));
      expect(analysis.result.direction).toEqual([1, 1, 0, 1]);
      expect(analysis.result.directionLabels).toEqual(["↑", "↑", "=", "↑"]);
    },
  );

  it("calculates entropy diversity and sample coefficient of variation", () => {
    const matrix = preferences.map((row) => row.slice(0, 3));
    expect(round4(entropyVariability(matrix))).toEqual([0.117, 0.0344, 0]);
    expect(round4(coefficientOfVariationVariability(matrix))).toEqual([0.6, 0.3333, 0]);
  });

  it("uses raw direction for corrections and preference type only for labels", () => {
    const analysis = new DariaAnalysis();
    analysis.matrix = [
      [3, 1, 2],
      [2, 3, 5],
      [1, 2, 2],
    ];
    analysis.preferenceType = CriterionType.COST;
    expect(analysis.result.direction).toEqual([-1, 1, 0]);
    expect(analysis.result.directionLabels).toEqual(["↑", "↓", "="]);
    expect(round4(analysis.scores)).toEqual([0.1835, 2.8165, 2]);
  });

  it("returns unchanged scores for one period and constant preferences", () => {
    const analysis = new DariaAnalysis();
    analysis.matrix = [[1, -2, 0]];
    expect(analysis.result).toEqual({
      scores: [1, -2, 0],
      variability: [0, 0, 0],
      direction: [0, 0, 0],
      directionLabels: ["=", "=", "="],
    });
    analysis.matrix = [[1], [1], [1]];
    expect(analysis.scores).toEqual([1]);
  });

  it("recomputes results, exposes debug and isolates callback mutations", () => {
    const analysis = new DariaAnalysis();
    analysis.matrix = preferences.map((row) => [...row]);
    const original = analysis.matrix.map((row) => [...row]);
    expect(analysis.debugBag).toBeUndefined();
    analysis.enableDebug(true);
    const result = analysis.result;
    expect(analysis.debugBag).toEqual({ ...result, latestScores: preferences[2] });
    analysis.variabilityCallback = (matrix) => {
      matrix[2][0] = 999;
      return [0, 0, 0, 0];
    };
    expect(analysis.scores).toEqual(preferences[2]);
    expect(analysis.matrix).toEqual(original);
    analysis.variabilityCallback = undefined;
    expect(analysis.scores).toEqual(result.scores);
    analysis.enableDebug(false);
    expect(analysis.debugBag).toBeUndefined();
  });

  it.each([
    { matrix: [], error: "Matrix must have non-empty, matching dimensions." },
    { matrix: [[]], error: "Matrix must have non-empty, matching dimensions." },
    { matrix: [[1, 2], [1]], error: "Matrix row must contain 2 finite values." },
    { matrix: [[NaN]], error: "Matrix row must contain 1 finite values." },
    { matrix: [[Infinity]], error: "Matrix row must contain 1 finite values." },
  ])("rejects malformed preferences (%#)", ({ matrix, error }) => {
    const analysis = new DariaAnalysis();
    analysis.matrix = matrix;
    expect(() => analysis.result).toThrow(new Error(error));
  });
  it("rejects invalid ordering and callback results", () => {
    const analysis = new DariaAnalysis();
    analysis.matrix = preferences;
    analysis.preferenceType = 0 as CriterionType;
    expect(() => analysis.scores).toThrow(new Error("DARIA preference type must be 1 or -1."));
    analysis.preferenceType = CriterionType.BENEFIT;
    for (const values of [[1], [NaN, 0, 0, 0], [Infinity, 0, 0, 0]]) {
      analysis.variabilityCallback = () => values;
      expect(() => analysis.scores).toThrow(
        new Error("DARIA variability must contain 4 finite values."),
      );
    }
  });
  it("rejects undefined variability divisors", () => {
    expect(() => giniVariability([[0]])).toThrow(
      new Error("The method is undefined because a divisor is zero or non-finite."),
    );
    expect(() => entropyVariability([[1]])).toThrow(
      new Error("The method is undefined because a divisor is zero or non-finite."),
    );
    expect(() => entropyVariability([[1], [-1]])).toThrow(
      new Error("The method is undefined because a divisor is zero or non-finite."),
    );
    expect(() => coefficientOfVariationVariability([[1]])).toThrow(
      new Error("The method is undefined because a divisor is zero or non-finite."),
    );
    expect(() => coefficientOfVariationVariability([[0], [0]])).toThrow(
      new Error("The method is undefined because a divisor is zero or non-finite."),
    );
  });
});
