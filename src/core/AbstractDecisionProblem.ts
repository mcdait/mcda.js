import type {
    CriteriaTypesInputInterface,
    DebugBag,
    DebuggableInterface,
    DecisionMatrix,
    MatrixInputInterface,
    Scores,
    WeightsInputInterface,
} from "../types";
import type { CriterionType } from "../types";
import type { NormalizationCallback } from "../types";

export abstract class AbstractDecisionProblem
    implements
        WeightsInputInterface,
        CriteriaTypesInputInterface,
        MatrixInputInterface,
        DebuggableInterface
{
    protected weights: number[] = [];
    protected types: CriterionType[] = [];
    protected matrix: DecisionMatrix = [];
    protected debugBag: DebugBag | undefined = undefined;
    protected normalizationCallback: NormalizationCallback | undefined;

    public getWeights(): number[] {
        return this.weights;
    }

    public setWeights(weights: number[]): void {
        this.weights = weights;
    }

    public getTypes(): CriterionType[] {
        return this.types;
    }

    public setTypes(types: CriterionType[]): void {
        this.types = types;
    }

    public getMatrix(): DecisionMatrix {
        return this.matrix;
    }

    public setMatrix(matrix: DecisionMatrix): void {
        this.matrix = matrix;
    }

    public getDebugBag(): DebugBag | undefined {
        return this.debugBag;
    }

    public enableDebug(enableDebug:boolean): void {
        this.debugBag = {};
    }

    public abstract compute(): Scores;
    protected abstract validate(): void

    public addToDebugBag(field: string, value: unknown): void {
        const debugBag = this.getDebugBag();

        if (debugBag !== undefined) {
            debugBag[field] = value;
        }
    }
}
