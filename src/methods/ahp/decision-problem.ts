import type {
  AlternativesInputInterface,
  CriteriaInputInterface,
  WeightsInputInterface,
  DebuggableInterface,
  DebugBag,
  DecisionMatrix,
  Scores,
} from "../../types";
import { finiteVector, sum, validateMatrix, validateWeights } from "../shared/numeric";

import type { AhpMatrix, AhpPriorityMethod, AhpConsistency } from "./types";

import { eigenvectorPriority } from "./priority-functions";

/** Classic AHP: one pairwise comparison matrix per criterion. */
export class AhpDecisionProblem
  implements
    AlternativesInputInterface,
    CriteriaInputInterface,
    WeightsInputInterface,
    DebuggableInterface
{
  protected _alternatives: string[] = [];
  protected _criteria: string[] = [];
  public get alternatives(): string[] {
    return this._alternatives;
  }
  public set alternatives(value: string[]) {
    this._alternatives = value;
  }
  public get criteria(): string[] {
    return this._criteria;
  }
  public set criteria(value: string[]) {
    this._criteria = value;
  }
  protected _matrix: AhpMatrix = [];
  protected _weights: number[] = [];
  protected _priorityMethod: AhpPriorityMethod = eigenvectorPriority;
  protected _debugBag: DebugBag | undefined;
  public get matrix(): AhpMatrix {
    return this._matrix;
  }
  public set matrix(value: AhpMatrix) {
    this._matrix = value;
  }
  public get weights(): number[] {
    return this._weights;
  }
  public set weights(value: number[]) {
    this._weights = value;
  }
  public get priorityMethod(): AhpPriorityMethod {
    return this._priorityMethod;
  }
  public set priorityMethod(value: AhpPriorityMethod) {
    this._priorityMethod = value;
  }
  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }
  public enableDebug(enabled: boolean): void {
    this._debugBag = enabled ? {} : undefined;
  }

  protected validate(): void {
    const matrices = this.matrix;
    if (!matrices.length) throw new Error("Classic AHP requires pairwise matrices.");
    validateWeights(this.weights, matrices.length);
    if (typeof this.priorityMethod !== "function")
      throw new Error("An AHP priority method is required.");
    const m = matrices[0].length;
    matrices.forEach((matrix) => {
      validateMatrix(matrix, m, m);
      this.validatePairwise(matrix);
    });
    this.validateNames(this.alternatives, m, "alternative");
    this.validateNames(this.criteria, matrices.length, "criterion");
  }

  private validatePairwise(matrix: DecisionMatrix): void {
    validateMatrix(matrix, matrix.length, matrix.length);
    for (let i = 0; i < matrix.length; i++) {
      if (Math.abs(matrix[i][i] - 1) > 1e-10)
        throw new Error("AHP pairwise diagonal must equal 1.");
      for (let j = 0; j < matrix.length; j++) {
        if (matrix[i][j] <= 0 || Math.abs(matrix[i][j] * matrix[j][i] - 1) > 1e-8) {
          throw new Error("AHP pairwise matrices must be positive and reciprocal.");
        }
      }
    }
  }

  private checkConsistency(matrix: DecisionMatrix): AhpConsistency {
    const priority = eigenvectorPriority(matrix);
    const n = matrix.length;
    const lambdaMax =
      sum(matrix.map((row, i) => sum(row.map((x, j) => x * priority[j])) / priority[i])) / n;
    const consistencyIndex = n <= 2 ? 0 : Math.max(0, (lambdaMax - n) / (n - 1));
    const randomIndex = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n - 1];
    const consistencyRatio =
      n <= 2 ? 0 : randomIndex === undefined ? undefined : consistencyIndex / randomIndex;
    return {
      lambdaMax,
      consistencyIndex,
      consistencyRatio,
      consistent: consistencyRatio === undefined ? undefined : consistencyRatio <= 0.1,
    };
  }

  private validateNames(names: string[], count: number, kind: string): void {
    if (!names.length) return;
    if (names.length !== count || names.some((name) => !name.trim())) {
      throw new Error(
        `AHP requires one non-empty ${kind} name per ${kind} when names are provided.`,
      );
    }
  }

  public addToDebugBag(field: string, value: unknown): void {
    if (this._debugBag !== undefined) this._debugBag[field] = value;
  }

  public get scores(): Scores {
    this.validate();
    const matrices = this.matrix;
    const m = matrices[0].length;
    const priorities = matrices.map((matrix) => {
      const p = this.priorityMethod(matrix.map((row) => [...row]));
      finiteVector(p, m, "AHP priority vector");
      if (p.some((x) => x < 0) || Math.abs(sum(p) - 1) > 1e-8)
        throw new Error("AHP priority vectors must be non-negative and sum to 1.");
      return p;
    });
    const scores = Array.from(
      { length: m },
      (_, i) => sum(priorities.map((p, j) => p[i] * this.weights[j])) / sum(this.weights),
    );
    finiteVector(scores, m, "AHP scores");
    if (this._debugBag)
      Object.assign(this._debugBag, {
        priorities,
        consistency: matrices.map((matrix) => this.checkConsistency(matrix)),
        scores,
      });
    return scores;
  }
}
