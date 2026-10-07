import { AbstractBaseDecisionProblem } from "./abstract-base-decision-problem";
import type {
  CriteriaTypesInputInterface,
  DecisionMatrix,
  DecisionMatrixObject,
  MatrixInputInterface,
  MatrixObjectInputInterface,
  CriterionType,
} from "../types";

export abstract class AbstractDecisionProblem
  extends AbstractBaseDecisionProblem
  implements CriteriaTypesInputInterface, MatrixInputInterface, MatrixObjectInputInterface
{
  protected _types: CriterionType[] = [];
  protected _matrix: DecisionMatrix = [];

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

  protected override validate(): void {
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
}
