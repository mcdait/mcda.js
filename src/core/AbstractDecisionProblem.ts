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
    protected _weights: number[] = [];
    protected _types: CriterionType[] = [];
    protected _matrix: DecisionMatrix = [];
    protected _debugBag: DebugBag | undefined = undefined;

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

    public get debugBag(): DebugBag | undefined {
        return this._debugBag;
    }

    public enableDebug(enableDebug:boolean): void {
        this._debugBag = {};
    }

    public abstract compute(): Scores;
    protected abstract validate(): void

    public addToDebugBag(field: string, value: unknown): void {
        const debugBag = this.debugBag;

        if (debugBag !== undefined) {
            debugBag[field] = value;
        }
    }
}
