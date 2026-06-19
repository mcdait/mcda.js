export type DecisionMatrix = number[][];
export type Scores = number[];

export enum CriterionType {
    Benefit = 1, // higher values are better
    Cost = -1, // lower values are better
}

export type DebugBag = Record<string, unknown>;

export type NormalizationCallback = (
    matrix: DecisionMatrix,
) => DecisionMatrix;

export interface InputMatrixInterface {
    getMatrix(): DecisionMatrix
    setMatrix(matrix: DecisionMatrix): void
}

export interface InputWeightsInterface {
    getWeights(): number[]
    setWeights(weights: number[]): void
}

export interface InputTypesInterface {
    getTypes(): CriterionType[]
    setTypes(types: CriterionType[]): void
}

export interface InputDebugBugInterface {
    getDebugBag(): DebugBag | undefined
    setDebugBag(debugBag: DebugBag | undefined): void
    addToDebugBag(field: string, value: unknown): void
}

export interface ConfigurableNormalizationInterface {
    getNormalizationCallback(): NormalizationCallback | undefined
    setNormalizationCallback(callback: NormalizationCallback | undefined): void
}

export abstract class AbstractDecisionProblem
    implements InputWeightsInterface, InputTypesInterface, InputMatrixInterface, InputDebugBugInterface
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

    public setDebugBag(debugBag: DebugBag | undefined): void {
        this.debugBag = debugBag;
    }

    public abstract compute(): Scores;
    protected abstract validate(): void

    public addToDebugBag(field: string, value: unknown): void
    {
        const debugBag = this.getDebugBag()
        if (debugBag !== undefined) {
            debugBag[field] = value;
        }
    }
}
