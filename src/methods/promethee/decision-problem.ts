import { CriterionType } from "../../types";
import type { DecisionMatrix, Scores } from "../../types";
import { AbstractDecisionProblem } from "../../core";
import { ConfigurablePreferenceFunctionsInterface, PreferenceFunction } from "./types";

export class PrometheeDecisionProblem
  extends AbstractDecisionProblem
  implements ConfigurablePreferenceFunctionsInterface
{
  protected _preferenceFunctions: PreferenceFunction[] = [];

  public get preferenceFunctions(): PreferenceFunction[] {
    return this._preferenceFunctions;
  }

  public set preferenceFunctions(preferenceFunctions: PreferenceFunction[]) {
    this._preferenceFunctions = preferenceFunctions;
  }

  public override get scores(): Scores {
    this.validate();
    return this.promethee();
  }

  protected override validate(): void {
    super.validate();
    this.validatePreferenceFunctions();
  }

  private promethee(): Scores {
    const preferenceMatrix = this.getPreferenceMatrix(this.matrix);
    this.addToDebugBag("preferenceMatrix", preferenceMatrix);

    const positiveFlows = this.getPositiveFlows(preferenceMatrix);
    this.addToDebugBag("positiveFlows", positiveFlows);

    const negativeFlows = this.getNegativeFlows(preferenceMatrix);
    this.addToDebugBag("negativeFlows", negativeFlows);

    const netFlows = positiveFlows.map((positiveFlow, alternativeIndex) => {
      const negativeFlow = negativeFlows[alternativeIndex] ?? 0;

      return positiveFlow - negativeFlow;
    });
    this.addToDebugBag("netFlows", netFlows);

    return netFlows;
  }

  private getPreferenceMatrix(matrix: DecisionMatrix): DecisionMatrix {
    return matrix.map((leftAlternative, leftIndex) =>
      matrix.map((rightAlternative, rightIndex) => {
        if (leftIndex === rightIndex) {
          return 0;
        }

        return this.getPreferenceDegree(leftAlternative, rightAlternative);
      }),
    );
  }

  private getPreferenceDegree(leftAlternative: number[], rightAlternative: number[]): number {
    return this.weights.reduce((sum, weight, criterionIndex) => {
      const leftValue = leftAlternative[criterionIndex] ?? 0;
      const rightValue = rightAlternative[criterionIndex] ?? 0;
      const criterionType = this.types[criterionIndex];
      const difference =
        criterionType === CriterionType.BENEFIT ? leftValue - rightValue : rightValue - leftValue;
      const preferenceFunction = this.preferenceFunctions[criterionIndex];
      const preference = this.getCriterionPreference(difference, preferenceFunction);

      return sum + weight * preference;
    }, 0);
  }

  private getCriterionPreference(
    difference: number,
    preferenceFunction: PreferenceFunction | undefined,
  ): number {
    if (preferenceFunction === undefined) {
      throw new Error("PROMETHEE preference function is required.");
    }

    const preference = preferenceFunction(difference);

    if (!Number.isFinite(preference) || preference < 0 || preference > 1) {
      throw new Error("PROMETHEE preference function must return a finite number between 0 and 1.");
    }

    return preference;
  }

  private getPositiveFlows(preferenceMatrix: DecisionMatrix): number[] {
    return preferenceMatrix.map((preferenceValues) => this.getAverage(preferenceValues));
  }

  private getNegativeFlows(preferenceMatrix: DecisionMatrix): number[] {
    return preferenceMatrix.map((_, alternativeIndex) => {
      const incomingPreferences = preferenceMatrix.map(
        (preferenceValues) => preferenceValues[alternativeIndex] ?? 0,
      );

      return this.getAverage(incomingPreferences);
    });
  }

  private getAverage(values: number[]): number {
    if (values.length <= 1) {
      return 0;
    }

    const sum = values.reduce((total, value) => total + value, 0);

    return sum / (values.length - 1);
  }

  private validatePreferenceFunctions(): void {
    if (this.preferenceFunctions.length !== this.weights.length) {
      throw new Error("PROMETHEE requires one preference function per weight.");
    }

    for (const preferenceFunction of this.preferenceFunctions) {
      if (typeof preferenceFunction !== "function") {
        throw new Error("PROMETHEE preference functions must be callable.");
      }
    }
  }
}
