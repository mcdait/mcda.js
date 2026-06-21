import { AbstractDecisionProblem } from "./AbstractDecisionProblem";
import { CriterionType } from "../types";
import type {
    ConfigurableNormalizationInterface,
    DecisionMatrix,
    NormalizationCallback,
    Scores,
} from "../types";

export class TopsisDecisionProblem
    extends AbstractDecisionProblem
    implements ConfigurableNormalizationInterface
{
    public override compute(): Scores {
        this.validate();
        return this.topsis();
    }

    public getNormalizationCallback(): NormalizationCallback | undefined {
        return this.normalizationCallback;
    }

    public setNormalizationCallback(
        normalizationCallback: NormalizationCallback | undefined,
    ): void {
        this.normalizationCallback = normalizationCallback;
    }

    private topsis(): Scores {
        if (this.normalizationCallback === undefined) {
            throw new Error("TOPSIS requires a normalization callback.");
        }

        const normalizedMatrix = this.normalizationCallback(this.getMatrix());
        this.addToDebugBag("normalizedMatrix", normalizedMatrix);
        const weightedNormalizedMatrix =
            this.applyWeights(normalizedMatrix);
        this.addToDebugBag("weightedNormalizedMatrix", weightedNormalizedMatrix);
        const idealBest = this.getIdealValues(weightedNormalizedMatrix, true);
        this.addToDebugBag("idealBest", idealBest);
        const idealWorst = this.getIdealValues(weightedNormalizedMatrix, false);
        this.addToDebugBag("idealWorst", idealWorst);
        const distanceToBest = this.getDistances(
            weightedNormalizedMatrix,
            idealBest,
        );
        this.addToDebugBag("distanceToBest", distanceToBest);
        const distanceToWorst = this.getDistances(
            weightedNormalizedMatrix,
            idealWorst,
        );
        this.addToDebugBag("distanceToWorst", distanceToWorst);
        const scores = distanceToWorst.map((worstDistance, alternativeIndex) => {
            const bestDistance = distanceToBest[alternativeIndex] ?? 0;
            const denominator = bestDistance + worstDistance;

            return denominator === 0 ? 0 : worstDistance / denominator;
        });

        return scores;
    }

    protected validate(): void {
        const criteriaCount = this.getWeights().length;

        if (criteriaCount === 0) {
            throw new Error("TOPSIS requires at least one criterion.");
        }

        if (this.getTypes().length !== criteriaCount) {
            throw new Error("TOPSIS requires one criterion type per weight.");
        }

        if (this.getMatrix().length === 0) {
            throw new Error("TOPSIS requires at least one alternative.");
        }

        for (const row of this.getMatrix()) {
            if (row.length !== criteriaCount) {
                throw new Error(
                    "TOPSIS matrix rows must match the weights length.",
                );
            }
        }
    }

    private applyWeights(matrix: DecisionMatrix): DecisionMatrix {
        return matrix.map((row) =>
            row.map((value, criterionIndex) => {
                const weight = this.getWeights()[criterionIndex] ?? 0;

                return value * weight;
            }),
        );
    }

    private getIdealValues(
        matrix: DecisionMatrix,
        bestValues: boolean,
    ): number[] {
        return this.getWeights().map((_, criterionIndex) => {
            const values = matrix.map((row) => row[criterionIndex] ?? 0);
            const type = this.getTypes()[criterionIndex];
            const benefitValue = bestValues ? Math.max : Math.min;
            const costValue = bestValues ? Math.min : Math.max;
            const picker =
                type === CriterionType.BENEFIT ? benefitValue : costValue;

            return picker(...values);
        });
    }

    private getDistances(matrix: DecisionMatrix, ideal: number[]): number[] {
        return matrix.map((row) => {
            const sumOfSquares = row.reduce((sum, value, criterionIndex) => {
                const idealValue = ideal[criterionIndex] ?? 0;

                return sum + (value - idealValue) ** 2;
            }, 0);

            return Math.sqrt(sumOfSquares);
        });
    }
}
