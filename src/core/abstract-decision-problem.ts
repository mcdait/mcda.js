import type {
  AlternativesInputInterface,
  CriteriaInputInterface,
  CriteriaTypesInputInterface,
  DebugBag,
  DebuggableInterface,
  DecisionMatrix,
  DecisionMatrixObject,
  MatrixInputInterface,
  MatrixObjectInputInterface,
  Scores,
  WeightsInputInterface,
  CriterionType,
} from "../types";

export abstract class AbstractDecisionProblem
  implements
    AlternativesInputInterface,
    CriteriaInputInterface,
    WeightsInputInterface,
    CriteriaTypesInputInterface,
    MatrixInputInterface,
    MatrixObjectInputInterface,
    DebuggableInterface
{
  protected _weights: number[] = [];
  protected _types: CriterionType[] = [];
  protected _matrix: DecisionMatrix = [];
  protected _alternatives: string[] = [];
  protected _criteria: string[] = [];
  protected _debugBag: DebugBag | undefined = undefined;

  public get alternatives(): string[] {
    return this._alternatives;
  }

  public set alternatives(alternatives: string[]) {
    this._alternatives = alternatives;
  }

  public get criteria(): string[] {
    return this._criteria;
  }

  public set criteria(criteria: string[]) {
    this._criteria = criteria;
  }

  public get weights(): number[] {
    return this._weights;
  }

  public set weights(weights: number[]) {
    this._weights = weights;
  }

  public get types(): CriterionType[] {
    return this._types;
  }

  public set types(types: CriterionType[]) {
    this._types = types;
  }

  public get matrix(): DecisionMatrix {
    return this._matrix;
  }

  public set matrix(matrix: DecisionMatrix) {
    this._matrix = matrix;
  }

  public get matrixObj(): DecisionMatrixObject {
    return Object.fromEntries(
      this.alternatives.map((alternative, alternativeIndex) => [
        alternative,
        Object.fromEntries(
          this.criteria.map((criterion, criterionIndex) => [
            criterion,
            this.matrix[alternativeIndex]?.[criterionIndex] ?? 0,
          ]),
        ),
      ]),
    );
  }

  public set matrixObj(matrixObj: DecisionMatrixObject) {
    const alternatives = Object.keys(matrixObj);
    const criteria = Object.keys(matrixObj[alternatives[0] ?? ""] ?? {});

    if (criteria.length === 0) {
      throw new Error("Decision problem matrix object requires at least one criterion.");
    }

    for (const alternative of alternatives) {
      const alternativeCriteria = Object.keys(matrixObj[alternative] ?? {});
      const hasSameCriteria =
        alternativeCriteria.length === criteria.length &&
        criteria.every((criterion) => alternativeCriteria.includes(criterion));

      if (!hasSameCriteria) {
        throw new Error(
          "Decision problem matrix object alternatives must contain the same criteria.",
        );
      }
    }

    this.alternatives = alternatives;
    this.criteria = criteria;
    this.matrix = alternatives.map((alternative) => {
      const criteriaValues = matrixObj[alternative];

      return criteria.map((criterion) => criteriaValues[criterion]);
    });
  }

  public get debugBag(): DebugBag | undefined {
    return this._debugBag;
  }

  public enableDebug(enableDebug: boolean): void {
    this._debugBag = {};
  }

  public abstract get scores(): Scores;

  protected validate(): void {
    const criteriaCount = this.weights.length;

    if (criteriaCount === 0) {
      throw new Error("Decision problem requires at least one criterion.");
    }

    if (this.types.length !== criteriaCount) {
      throw new Error("Decision problem requires one criterion type per weight.");
    }

    if (this.matrix.length === 0) {
      throw new Error("Decision problem requires at least one alternative.");
    }

    for (const alternativeValues of this.matrix) {
      if (alternativeValues.length !== criteriaCount) {
        throw new Error("Decision problem matrix rows must match the weights length.");
      }
    }

    this.validateOptionalNames(this.alternatives, this.matrix.length, "alternative");
    this.validateOptionalNames(this.criteria, criteriaCount, "criterion");
  }

  private validateOptionalNames(names: string[], expectedCount: number, fieldName: string): void {
    if (names.length === 0) {
      return;
    }

    if (names.length !== expectedCount) {
      throw new Error(
        `Decision problem requires one ${fieldName} name per ${fieldName} when ${fieldName} names are provided.`,
      );
    }

    for (const name of names) {
      if (name.trim().length === 0) {
        throw new Error(`Decision problem ${fieldName} names cannot be empty.`);
      }
    }
  }

  public addToDebugBag(field: string, value: unknown): void {
    const debugBag = this.debugBag;

    if (debugBag !== undefined) {
      debugBag[field] = value;
    }
  }
}
