import type {
    DecisionProblemArrayInput,
    DecisionProblemInput,
    DecisionProblemInputAdapter,
} from "../types/index.js";

class ObjectDecisionProblemInputAdapter
    implements DecisionProblemInputAdapter<DecisionProblemInput>
{
    public supports(input: unknown): input is DecisionProblemInput {
        return (
            typeof input === "object" &&
            input !== null &&
            !Array.isArray(input) &&
            "matrix" in input &&
            "weights" in input &&
            "types" in input
        );
    }

    public normalize(input: DecisionProblemInput): DecisionProblemInput {
        return input;
    }
}

class ArrayDecisionProblemInputAdapter
    implements DecisionProblemInputAdapter<DecisionProblemArrayInput>
{
    public supports(input: unknown): input is DecisionProblemArrayInput {
        return Array.isArray(input);
    }

    public normalize(input: DecisionProblemArrayInput): DecisionProblemInput {
        const [matrix, weights, types, alternatives, criteria] = input;

        return {
            matrix,
            weights,
            types,
            alternatives,
            criteria,
        };
    }
}

export const defaultDecisionProblemInputAdapters: readonly DecisionProblemInputAdapter[] =
    [
        new ObjectDecisionProblemInputAdapter(),
        new ArrayDecisionProblemInputAdapter(),
    ];
