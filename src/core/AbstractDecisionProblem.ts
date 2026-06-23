import type {
    AlternativesInputInterface,
    CriteriaInputInterface,
    CriteriaTypesInputInterface,
    DebugBag,
    DebuggableInterface,
    DecisionMatrix,
    DecisionProblemInput,
    DecisionProblemInputAdapter,
    MatrixInputInterface,
    Scores,
    WeightsInputInterface,
} from "../types/index.js";
import type { CriterionType } from "../types/index.js";
import { defaultDecisionProblemInputAdapters } from "../input/DecisionProblemInputAdapter.js";

export abstract class AbstractDecisionProblem
    implements
        AlternativesInputInterface,
        CriteriaInputInterface,
        WeightsInputInterface,
        CriteriaTypesInputInterface,
        MatrixInputInterface,
        DebuggableInterface
{
    protected _weights: number[] = [];
    protected _types: CriterionType[] = [];
    protected _matrix: DecisionMatrix = [];
    protected _alternatives: string[] = [];
    protected _criteria: string[] = [];
    protected _debugBag: DebugBag | undefined = undefined;

    public constructor(input?: unknown) {
        if (input !== undefined) {
            this.loadDecisionProblemInput(input);
        }
    }

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

    public get debugBag(): DebugBag | undefined {
        return this._debugBag;
    }

    public enableDebug(enableDebug:boolean): void {
        this._debugBag = {};
    }

    public abstract get scores(): Scores;

    protected validate(): void {
        const criteriaCount = this.weights.length;

        if (criteriaCount === 0) {
            throw new Error("Decision problem requires at least one criterion.");
        }

        if (this.types.length !== criteriaCount) {
            throw new Error(
                "Decision problem requires one criterion type per weight.",
            );
        }

        if (this.matrix.length === 0) {
            throw new Error("Decision problem requires at least one alternative.");
        }

        for (const row of this.matrix) {
            if (row.length !== criteriaCount) {
                throw new Error(
                    "Decision problem matrix rows must match the weights length.",
                );
            }
        }

        this.validateOptionalNames(
            this.alternatives,
            this.matrix.length,
            "alternative",
        );
        this.validateOptionalNames(
            this.criteria,
            criteriaCount,
            "criterion",
        );
    }

    private validateOptionalNames(
        names: string[],
        expectedCount: number,
        fieldName: string,
    ): void {
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
                throw new Error(
                    `Decision problem ${fieldName} names cannot be empty.`,
                );
            }
        }
    }

    public addToDebugBag(field: string, value: unknown): void {
        const debugBag = this.debugBag;

        if (debugBag !== undefined) {
            debugBag[field] = value;
        }
    }

    public loadDecisionProblemInput(input: unknown): void {
        const normalizedInput = this.normalizeDecisionProblemInput(input);

        this.weights = normalizedInput.weights;
        this.types = normalizedInput.types;
        this.matrix = normalizedInput.matrix;
        this.alternatives = normalizedInput.alternatives ?? [];
        this.criteria = normalizedInput.criteria ?? [];
    }

    protected getInputAdapters(): readonly DecisionProblemInputAdapter[] {
        return defaultDecisionProblemInputAdapters;
    }

    private normalizeDecisionProblemInput(
        input: unknown,
    ): DecisionProblemInput {
        const adapter = this.getInputAdapters().find((inputAdapter) =>
            inputAdapter.supports(input),
        );

        if (adapter === undefined) {
            throw new Error("Unsupported decision problem input format.");
        }

        return adapter.normalize(input);
    }
}
