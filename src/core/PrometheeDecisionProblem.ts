import { AbstractDecisionProblem } from "./AbstractDecisionProblem";
import { CriterionType } from "../types";
import type {
    ConfigurableNormalizationInterface,
    DecisionMatrix,
    NormalizationCallback,
    Scores,
} from "../types";

export class PrometheeDecisionProblem
    extends AbstractDecisionProblem
    implements ConfigurableNormalizationInterface
{
    public override compute(): Scores {
        this.validate();
        return this.promethee();
    }

    private promethee(): Scores {
        if (this.normalizationCallback === undefined) {
            throw new Error("PROMETHEE requires a normalization callback.");
        }

        const normalizedMatrix = this.normalizationCallback(this.getMatrix());
        const preferenceMatrix = this.getPreferenceMatrix(normalizedMatrix);
        const positiveFlows = this.getPositiveFlows(preferenceMatrix);
        const negativeFlows = this.getNegativeFlows(preferenceMatrix);

        return positiveFlows.map((positiveFlow, alternativeIndex) => {
            const negativeFlow = negativeFlows[alternativeIndex] ?? 0;

            return positiveFlow - negativeFlow;
        });
    }

    protected validate(): void {
        const criteriaCount = this.getWeights().length;

        if (criteriaCount === 0) {
            throw new Error("PROMETHEE requires at least one criterion.");
        }

        if (this.getTypes().length !== criteriaCount) {
            throw new Error("PROMETHEE requires one criterion type per weight.");
        }

        if (this.getMatrix().length === 0) {
            throw new Error("PROMETHEE requires at least one alternative.");
        }

        for (const row of this.getMatrix()) {
            if (row.length !== criteriaCount) {
                throw new Error(
                    "PROMETHEE matrix rows must match the weights length.",
                );
            }
        }
    }

    private getPreferenceMatrix(matrix: DecisionMatrix): DecisionMatrix {
        return matrix.map((leftAlternative, leftIndex) =>
            matrix.map((rightAlternative, rightIndex) => {
                if (leftIndex === rightIndex) {
                    return 0;
                }

                return this.getPreferenceDegree(
                    leftAlternative,
                    rightAlternative,
                );
            }),
        );
    }

    private getPreferenceDegree(
        leftAlternative: number[],
        rightAlternative: number[],
    ): number {
        return this.getWeights().reduce((sum, weight, criterionIndex) => {
            const leftValue = leftAlternative[criterionIndex] ?? 0;
            const rightValue = rightAlternative[criterionIndex] ?? 0;
            const type = this.getTypes()[criterionIndex];
            const difference =
                type === CriterionType.BENEFIT
                    ? leftValue - rightValue
                    : rightValue - leftValue;
            const preference = difference > 0 ? difference : 0;

            return sum + weight * preference;
        }, 0);
    }

    private getPositiveFlows(preferenceMatrix: DecisionMatrix): number[] {
        return preferenceMatrix.map((row) => this.getAverage(row));
    }

    private getNegativeFlows(preferenceMatrix: DecisionMatrix): number[] {
        return preferenceMatrix.map((_, alternativeIndex) => {
            const column = preferenceMatrix.map(
                (row) => row[alternativeIndex] ?? 0,
            );

            return this.getAverage(column);
        });
    }

    private getAverage(values: number[]): number {
        if (values.length <= 1) {
            return 0;
        }

        const sum = values.reduce((total, value) => total + value, 0);

        return sum / (values.length - 1);
    }

    public getNormalizationCallback(): NormalizationCallback | undefined {
        return this.normalizationCallback;
    }

    public setNormalizationCallback(
        normalizationCallback: NormalizationCallback | undefined,
    ): void {
        this.normalizationCallback = normalizationCallback;
    }
}
