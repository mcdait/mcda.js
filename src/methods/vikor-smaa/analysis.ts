import type { CriterionType, DebugBag, DecisionMatrix } from "../../types";
import type { NormalizationCallback } from "../../types/core";
import { rank } from "../../utils/ranking";
import {
  finiteVector,
  normalize,
  sum,
  unitInterval,
  validateData,
  validateWeights,
} from "../shared/numeric";
import { calculateVikor } from "../vikor/calculation";
import type { VikorSmaaResult } from "./types";

/** Deterministic SMAA: callers supply the exact weight samples to analyze. */
export class VikorSmaaAnalysis {
  protected _matrix: DecisionMatrix = [];
  protected _types: CriterionType[] = [];
  protected _weightSamples: number[][] = [];
  protected _v = 0.5;
  protected _normalizationCallback: NormalizationCallback | undefined;
  protected _debugBag: DebugBag | undefined;
  public get matrix(): DecisionMatrix {
    return this._matrix;
  }
  public set matrix(value: DecisionMatrix) {
    this._matrix = value;
  }
  public get types(): CriterionType[] {
    return this._types;
  }
  public set types(value: CriterionType[]) {
    this._types = value;
  }
  public get weightSamples(): number[][] {
    return this._weightSamples;
  }
  public set weightSamples(value: number[][]) {
    this._weightSamples = value;
  }
  public get v(): number {
    return this._v;
  }
  public set v(value: number) {
    this._v = value;
  }
  public get normalizationCallback(): NormalizationCallback | undefined {
    return this._normalizationCallback;
  }
  public set normalizationCallback(value: NormalizationCallback | undefined) {
    this._normalizationCallback = value;
  }
  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }
  public enableDebug(enabled: boolean): void {
    this._debugBag = enabled ? {} : undefined;
  }

  public get result(): VikorSmaaResult {
    if (!this.weightSamples.length)
      throw new Error("VIKOR-SMAA requires at least one weight sample.");
    validateData(this.matrix, this.weightSamples[0], this.types);
    this.weightSamples.forEach((w) => validateWeights(w, this.types.length));
    unitInterval(this.v, "VIKOR-SMAA v");
    const matrix = this.normalizationCallback
      ? normalize(this.matrix, this.types, this.normalizationCallback)
      : this.matrix.map((row) => row.map((x, j) => x * this.types[j]));
    const m = matrix.length,
      n = this.types.length,
      count = this.weightSamples.length;
    const preferences = this.weightSamples.map((w) => {
      const scores = calculateVikor(matrix, w, this.v, "pyrepo").Q;
      finiteVector(scores, m, "VIKOR-SMAA preferences");
      return scores;
    });
    const sampleRanks = preferences.map((pref) => rank(pref, false));
    const rankAcceptabilityIndex = Array.from({ length: m }, () => Array(m).fill(0) as number[]);
    const centralWeightVectors = Array.from({ length: m }, () => Array(n).fill(0) as number[]);
    const rankScores = Array(m).fill(0) as number[];
    sampleRanks.forEach((ranks, iteration) => {
      ranks.forEach((r, i) => {
        rankAcceptabilityIndex[i][r - 1] += 1;
        rankScores[i] += ranks.filter((other) => other > r).length;
      });
      // Match pyrepo's argmin: only the first tied winner gets central weights.
      const winner = ranks.indexOf(Math.min(...ranks));
      this.weightSamples[iteration].forEach((w, j) => (centralWeightVectors[winner][j] += w));
    });
    for (let i = 0; i < m; i++) {
      rankAcceptabilityIndex[i] = rankAcceptabilityIndex[i].map((x) => x / count);
      const total = sum(centralWeightVectors[i]);
      if (total > 0) centralWeightVectors[i] = centralWeightVectors[i].map((x) => x / total);
      rankScores[i] /= count;
    }
    const result = { rankAcceptabilityIndex, centralWeightVectors, ranks: rank(rankScores) };
    if (this._debugBag)
      Object.assign(this._debugBag, result, { preferences, sampleRanks, rankScores });
    return result;
  }
}
