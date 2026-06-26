import { describe, expect, test } from "@jest/globals";
import { AbstractDecisionProblem } from "../../../src/core/AbstractDecisionProblem.js";
import { CriterionType } from "../../../src/types/index.js";
import type { DecisionMatrix, Scores } from "../../../src/types/index.js";

const matrix: DecisionMatrix = [
    [8, 7, 1200],
    [7, 9, 1000],
    [9, 6, 1400],
];

class TestDecisionProblem extends AbstractDecisionProblem {
    public get scores(): Scores {
        this.validate();

        return this.matrix.map((row) =>
            row.reduce((sum, value) => sum + value, 0),
        );
    }
}

describe("AbstractDecisionProblem", () => {
    test("stores data assigned through regular setters", () => {
        const problem = new TestDecisionProblem();

        problem.alternatives = ["a1", "a2", "a3"];
        problem.criteria = ["c1", "c2", "c3"];
        problem.matrix = matrix;
        problem.weights = [0.4, 0.35, 0.25];
        problem.types = [
            CriterionType.BENEFIT,
            CriterionType.BENEFIT,
            CriterionType.COST,
        ];

        expect(problem.alternatives).toEqual(["a1", "a2", "a3"]);
        expect(problem.criteria).toEqual(["c1", "c2", "c3"]);
        expect(problem.matrix).toEqual(matrix);
        expect(problem.weights).toEqual([0.4, 0.35, 0.25]);
        expect(problem.types).toEqual([
            CriterionType.BENEFIT,
            CriterionType.BENEFIT,
            CriterionType.COST,
        ]);
        expect(problem.scores).toEqual([1215, 1016, 1415]);
    });

    test("sets matrix, alternatives, and criteria from matrix object", () => {
        const problem = new TestDecisionProblem();

        problem.matrixObj = {
            a1: { c1: 8, c2: 7, c3: 1200 },
            a2: { c1: 7, c2: 9, c3: 1000 },
            a3: { c1: 9, c2: 6, c3: 1400 },
        };

        expect(problem.alternatives).toEqual(["a1", "a2", "a3"]);
        expect(problem.criteria).toEqual(["c1", "c2", "c3"]);
        expect(problem.matrix).toEqual(matrix);
    });

    test("returns matrix object from matrix, alternatives, and criteria", () => {
        const problem = new TestDecisionProblem();

        problem.alternatives = ["a1", "a2", "a3"];
        problem.criteria = ["c1", "c2", "c3"];
        problem.matrix = matrix;

        expect(problem.matrixObj).toEqual({
            a1: { c1: 8, c2: 7, c3: 1200 },
            a2: { c1: 7, c2: 9, c3: 1000 },
            a3: { c1: 9, c2: 6, c3: 1400 },
        });
    });

    test("throws when matrix object has no criteria", () => {
        const problem = new TestDecisionProblem();

        expect(() => {
            problem.matrixObj = {};
        }).toThrow(
            "Decision problem matrix object requires at least one criterion.",
        );
    });

    test("throws when matrix object alternative has no criteria", () => {
        const problem = new TestDecisionProblem();

        expect(() => {
            problem.matrixObj = {
                a1: {},
            };
        }).toThrow(
            "Decision problem matrix object requires at least one criterion.",
        );
    });

    test("throws when matrix object alternatives have different criteria counts", () => {
        const problem = new TestDecisionProblem();

        expect(() => {
            problem.matrixObj = {
                a1: { c1: 8, c2: 7, c3: 1200 },
                a2: { c1: 7, c2: 9 },
            };
        }).toThrow(
            "Decision problem matrix object alternatives must contain the same criteria.",
        );
    });

    test("throws when matrix object alternatives have different criteria", () => {
        const problem = new TestDecisionProblem();

        expect(() => {
            problem.matrixObj = {
                a1: { c1: 8, c2: 7, c3: 1200 },
                a2: { c1: 7, c2: 9, c4: 1000 },
            };
        }).toThrow(
            "Decision problem matrix object alternatives must contain the same criteria.",
        );
    });

    test("adds values to debug bag only when debug is enabled", () => {
        const problem = new TestDecisionProblem();

        problem.addToDebugBag("ignored", 1);
        expect(problem.debugBag).toBeUndefined();

        problem.enableDebug(true);
        problem.addToDebugBag("stored", 2);

        expect(problem.debugBag).toEqual({ stored: 2 });
    });
});
