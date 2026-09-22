import { describe, expect, it } from "@jest/globals";
import type { VikorSmaaResult } from "../../../src";
import { VikorSmaaAnalysis, sumNormalizationCallback } from "../../../src";
// konkurencja/python/pyrepo_mcda_check-vikor-smaa.py; pyrepo_mcda 0.1.8.
const rounded = (matrix: number[][]) =>
  matrix.map((row) => row.map((x) => Math.round(x * 10000) / 10000));
function createAnalysis(second = false): VikorSmaaAnalysis {
  const analysis = new VikorSmaaAnalysis();
  analysis.matrix = second
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
  analysis.types = second ? [1, 1, -1, -1] : [1, 1, -1];
  analysis.weightSamples = second
    ? [
        [0.25, 0.3, 0.2, 0.25],
        [0.1, 0.5, 0.2, 0.2],
        [0.6, 0.1, 0.1, 0.2],
      ]
    : [
        [0.4, 0.35, 0.25],
        [0.2, 0.3, 0.5],
        [0.6, 0.2, 0.2],
      ];
  return analysis;
}
function verify(
  result: VikorSmaaResult,
  acceptability: number[][],
  weights: number[][],
  ranks: number[],
) {
  expect(rounded(result.rankAcceptabilityIndex)).toEqual(acceptability);
  expect(rounded(result.centralWeightVectors)).toEqual(weights);
  expect(result.ranks).toEqual(ranks);
  result.rankAcceptabilityIndex.forEach((row) =>
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12),
  );
  result.centralWeightVectors.forEach((row) =>
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(row.some((x) => x > 0) ? 1 : 0, 12),
  );
}
describe("VikorSmaaAnalysis", () => {
  it("matches Python default to four decimals", () => {
    const analysis = createAnalysis(false);

    verify(
      analysis.result,
      [
        [0.3333, 0.6667, 0.0],
        [0.3333, 0.3333, 0.3333],
        [0.3333, 0.0, 0.6667],
      ],
      [
        [0.4, 0.35, 0.25],
        [0.2, 0.3, 0.5],
        [0.6, 0.2, 0.2],
      ],
      [1, 2, 3],
    );
  });
  it("matches Python second to four decimals", () => {
    const analysis = createAnalysis(true);

    verify(
      analysis.result,
      [
        [0.3333, 0.3333, 0.0, 0.3333],
        [0.0, 0.3333, 0.6667, 0.0],
        [0.3333, 0.3333, 0.3333, 0.0],
        [0.3333, 0.0, 0.0, 0.6667],
      ],
      [
        [0.1, 0.5, 0.2, 0.2],
        [0.0, 0.0, 0.0, 0.0],
        [0.25, 0.3, 0.2, 0.25],
        [0.6, 0.1, 0.1, 0.2],
      ],
      [2, 3, 1, 4],
    );
  });
  it("matches Python single to four decimals", () => {
    const analysis = createAnalysis(false);
    analysis.weightSamples = analysis.weightSamples.slice(0, 1);
    verify(
      analysis.result,
      [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
      ],
      [
        [0.4, 0.35, 0.25],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
      ],
      [1, 2, 3],
    );
  });
  it("matches Python ties to four decimals", () => {
    const analysis = createAnalysis(false);
    analysis.matrix = [
      [1, 3],
      [3, 1],
      [2, 2],
    ];
    analysis.types = [1, 1];
    analysis.weightSamples = [[0.5, 0.5]];
    verify(
      analysis.result,
      [
        [0.0, 1.0, 0.0],
        [0.0, 1.0, 0.0],
        [1.0, 0.0, 0.0],
      ],
      [
        [0.0, 0.0],
        [0.0, 0.0],
        [0.5, 0.5],
      ],
      [2, 2, 1],
    );
  });
  it("matches Python v_0 to four decimals", () => {
    const analysis = createAnalysis(false);
    analysis.v = 0;
    verify(
      analysis.result,
      [
        [0.3333, 0.6667, 0.0],
        [0.3333, 0.0, 0.6667],
        [0.3333, 0.3333, 0.3333],
      ],
      [
        [0.4, 0.35, 0.25],
        [0.2, 0.3, 0.5],
        [0.6, 0.2, 0.2],
      ],
      [1, 3, 2],
    );
  });
  it("matches Python v_1 to four decimals", () => {
    const analysis = createAnalysis(false);
    analysis.v = 1;
    verify(
      analysis.result,
      [
        [0.0, 1.0, 0.0],
        [0.6667, 0.0, 0.3333],
        [0.3333, 0.0, 0.6667],
      ],
      [
        [0.0, 0.0, 0.0],
        [0.3, 0.325, 0.375],
        [0.6, 0.2, 0.2],
      ],
      [2, 1, 3],
    );
  });
  it("matches Python normalized to four decimals", () => {
    const analysis = createAnalysis(false);
    analysis.v = 0.3;
    analysis.normalizationCallback = sumNormalizationCallback;
    verify(
      analysis.result,
      [
        [0.3333, 0.6667, 0.0],
        [0.3333, 0.3333, 0.3333],
        [0.3333, 0.0, 0.6667],
      ],
      [
        [0.4, 0.35, 0.25],
        [0.2, 0.3, 0.5],
        [0.6, 0.2, 0.2],
      ],
      [1, 2, 3],
    );
  });
  it("does not mutate inputs, recalculates and supports debug", () => {
    const analysis = createAnalysis();
    const matrix = analysis.matrix.map((row) => [...row]);
    const samples = analysis.weightSamples.map((row) => [...row]);
    const result = analysis.result;
    expect(analysis.debugBag).toBeUndefined();
    analysis.enableDebug(true);
    expect(analysis.result).toEqual(result);
    expect(analysis.debugBag?.ranks).toEqual(result.ranks);
    analysis.v = 0;
    expect(analysis.result.ranks).toEqual([1, 3, 2]);
    expect(analysis.matrix).toEqual(matrix);
    expect(analysis.weightSamples).toEqual(samples);
    analysis.enableDebug(false);
    analysis.result;
    expect(analysis.debugBag).toBeUndefined();
  });
  it("assigns central weights to the first tied winner", () => {
    const analysis = createAnalysis();
    analysis.matrix = [
      [1, 3],
      [3, 1],
    ];
    analysis.types = [1, 1];
    analysis.weightSamples = [[0.5, 0.5]];
    expect(analysis.result).toEqual({
      rankAcceptabilityIndex: [
        [1, 0],
        [1, 0],
      ],
      centralWeightVectors: [
        [0.5, 0.5],
        [0, 0],
      ],
      ranks: [1, 1],
    });
  });
  it("rejects absent, malformed, zero and non-finite weight samples", () => {
    const analysis = createAnalysis();
    for (const samples of [[], [[1, 2]], [[0, 0, 0]], [[NaN, 0, 1]], [[-1, 1, 1]]]) {
      analysis.weightSamples = samples;
      expect(() => analysis.result).toThrow();
    }
  });
  it.each([-1, 2, Infinity, NaN])("rejects v=%s", (v) => {
    const analysis = createAnalysis();
    analysis.v = v;
    expect(() => analysis.result).toThrow();
  });
  it("rejects constant criteria and invalid callback results", () => {
    const analysis = createAnalysis();
    analysis.normalizationCallback = () => [[1]];
    expect(() => analysis.result).toThrow();
    analysis.normalizationCallback = undefined;
    analysis.matrix = [
      [1, 2, 3],
      [1, 4, 5],
    ];
    expect(() => analysis.result).toThrow(/equal values/);
  });
});

it("uses the Python equal-range VIKOR policy for SMAA", () => {
  const analysis = createAnalysis();
  analysis.matrix = [
    [1, 3],
    [3, 1],
  ];
  analysis.types = [1, 1];
  analysis.weightSamples = [[0.5, 0.5]];
  analysis.enableDebug(true);
  analysis.result;
  expect(analysis.debugBag?.preferences).toEqual([[0.5, 0.5]]);
});
