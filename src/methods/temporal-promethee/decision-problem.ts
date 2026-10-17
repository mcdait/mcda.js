import { AbstractBaseDecisionProblem } from "../../core";
import { CriterionType } from "../../types";
import type { DecisionMatrix, Scores, CriteriaTypesInputInterface } from "../../types";
import { calculateDaria } from "../daria/calculation";
import { standardDeviationVariability } from "../daria/variability-functions";
import type { VariabilityCallback } from "../daria/types";
import { PrometheeDecisionProblem } from "../promethee/decision-problem";
import { usualPreference } from "../promethee/preference-functions";
import type {
  ConfigurablePreferenceFunctionsInterface,
  PreferenceFunction,
} from "../promethee/types";
import { validateData, validateMatrix } from "../shared/numeric";
import type { TemporalPrometheeResult } from "./types";

export class TemporalPrometheeDecisionProblem
  extends AbstractBaseDecisionProblem
  implements CriteriaTypesInputInterface, ConfigurablePreferenceFunctionsInterface
{
  protected _matrices: DecisionMatrix[] = [];
  protected _types: CriterionType[] = [];
  protected _preferenceFunctions: PreferenceFunction[] = [];
  protected _variabilityCallback: VariabilityCallback | undefined;

  /** Ordered oldest to newest; each matrix has alternatives in rows. */
  public get matrices(): DecisionMatrix[] {
    return this._matrices;
  }
  public set matrices(value: DecisionMatrix[]) {
    this._matrices = value;
  }
  public get types(): CriterionType[] {
    return this._types;
  }
  public set types(value: CriterionType[]) {
    this._types = value;
  }
  public get preferenceFunctions(): PreferenceFunction[] {
    return this._preferenceFunctions;
  }
  public set preferenceFunctions(value: PreferenceFunction[]) {
    this._preferenceFunctions = value;
  }
  public get variabilityCallback(): VariabilityCallback | undefined {
    return this._variabilityCallback;
  }
  public set variabilityCallback(value: VariabilityCallback | undefined) {
    this._variabilityCallback = value;
  }
  public override get scores(): Scores {
    return this.result.scores;
  }

  public get result(): TemporalPrometheeResult {
    this.validate();
    const problem = new PrometheeDecisionProblem();
    problem.weights = this.weights;
    problem.types = this.types;
    problem.preferenceFunctions = this.preferenceFunctions.length
      ? this.preferenceFunctions
      : this.weights.map(() => usualPreference);
    const netFlows = this.matrices.map((matrix) => {
      problem.matrix = matrix;
      return problem.scores;
    });
    const result = {
      ...calculateDaria(
        netFlows,
        this.variabilityCallback ?? standardDeviationVariability,
        CriterionType.BENEFIT,
      ),
      netFlows,
    };
    this.addToDebugBag("latestScores", [...netFlows[netFlows.length - 1]]);
    for (const [field, value] of Object.entries(result)) this.addToDebugBag(field, value);
    return result;
  }

  protected override validate(): void {
    if (!this.matrices.length) throw new Error("Temporal PROMETHEE requires at least one period.");
    const count = this.matrices[0].length;
    if (count < 2) throw new Error("Temporal PROMETHEE requires at least two alternatives.");
    for (const matrix of this.matrices) {
      validateMatrix(matrix, count, this.weights.length);
      validateData(matrix, this.weights, this.types);
    }
    this.validateOptionalNames(this.alternatives, count, "alternative");
    this.validateOptionalNames(this.criteria, this.weights.length, "criterion");
    if (
      this.preferenceFunctions.length &&
      (this.preferenceFunctions.length !== this.weights.length ||
        this.preferenceFunctions.some((fn) => typeof fn !== "function"))
    )
      throw new Error(
        "Temporal PROMETHEE requires one callable preference function per criterion.",
      );
  }
}
